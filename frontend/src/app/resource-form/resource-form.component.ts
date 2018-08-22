import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../category';
import { ErrorMatcher } from '../error-matcher';
import { Fieldset } from '../fieldset';
import { FormField } from '../form-field';
import { Resource } from '../resource';
import { ResourceCategory } from '../resource-category';
import { ResourceApiService } from '../shared/resource-api/resource-api.service';
import { fadeTransition } from '../shared/animations';
import { ValidateUrl } from '../shared/validators/url.validator';
import { Availability } from '../availability';
import { ResourceAttachment } from '../resource-attachment';
import { switchMap, map, mergeMap, mergeAll } from 'rxjs/operators';

@Component({
  selector: 'app-resource-form',
  templateUrl: './resource-form.component.html',
  styleUrls: ['./resource-form.component.scss'],
  animations: [fadeTransition()]
})
export class ResourceFormComponent implements OnInit {
  @HostBinding('@fadeTransition')
  allCategories: Category[] = [];
  resourceCategories: ResourceCategory[] = [];
  createNew = false;
  error: string;
  errorMatcher = new ErrorMatcher();
  isDataLoaded = false;
  resource: Resource;
  category: Category;
  resourceForm: FormGroup = new FormGroup({});
  showConfirmDelete = false;
  savesInAction = 0;
  files = {};

  // Field groupings
  fieldsets: Fieldset[] = [];

  // Form Fields
  fields = {
    name: new FormField({
      formControl: new FormControl(),
      required: true,
      maxLength: 140,
      minLength: 1,
      placeholder: 'Name',
      type: 'text',
    }),
    description: new FormField({
      formControl: new FormControl(),
      required: false,
      placeholder: 'Description',
      type: 'textarea',
      options: {
        status: ['words'],
      }
    }),
    contact_notes: new FormField({
      formControl: new FormControl(),
      required: false,
      maxLength: 100,
      minLength: 1,
      placeholder: 'Contact Details',
      type: 'text',
      fieldsetId: 'contact_info',
      fieldsetLabel: 'Contact:'
    }),
    contact_email: new FormField({
      formControl: new FormControl(),
      required: false,
      maxLength: 100,
      minLength: 1,
      placeholder: 'Contact Email',
      type: 'email',
      fieldsetId: 'contact_info'
    }),
    contact_phone: new FormField({
      formControl: new FormControl(),
      required: false,
      maxLength: 100,
      minLength: 1,
      placeholder: 'Contact Phone',
      type: 'text',
      fieldsetId: 'contact_info'
    }),
    owner: new FormField({
      formControl: new FormControl(),
      required: true,
      maxLength: 100,
      minLength: 1,
      placeholder: 'Owner',
      type: 'text'
    }),
    cost: new FormField({
      formControl: new FormControl(),
      required: false,
      placeholder: 'Cost Type',
      type: 'select',
      selectOptions: [
        'N / A',
        'Variable',
        'Free Across iTHRIV',
        'Free to Home Institution',
        'Cost Recovery',
      ]
    }),
    type_id: new FormField({
      formControl: new FormControl(),
      required: true,
      placeholder: 'Select Type',
      type: 'select',
      apiSource: 'getTypes'
    }),
    institution_id: new FormField({
      formControl: new FormControl(),
      required: true,
      placeholder: 'Home Institution',
      type: 'select',
      apiSource: 'getInstitutions',
      fieldsetId: 'institution_prefs',
      fieldsetLabel: 'Institutions'
    }),
    'availabilities.institution_id': new FormField({
      formControl: new FormControl(),
      required: false,
      placeholder: 'Institutions that may access this resource',
      type: 'select',
      multiSelect: true,
      apiSource: 'getInstitutions',
      fieldsetId: 'institution_prefs',
    }),
    website: new FormField({
      formControl: new FormControl(),
      required: false,
      maxLength: 200,
      minLength: 7,
      placeholder: 'Website',
      type: 'url'
    }),
    categories: new FormField({
      formGroup: new FormGroup({}),
      required: true,
      placeholder: 'Select Categories',
      type: 'tree',
      apiSource: 'getCategories',
      multiSelect: true
    }),
    approved: new FormField({
      formControl: new FormControl(),
      required: true,
      placeholder: 'Approval Status',
      type: 'select',
      selectOptions: [
        'Approved',
        'Unapproved'
      ]
    }),
    attachments: new FormField({
      formControl: new FormControl(),
      files: [],
      required: false,
      placeholder: 'Attachments',
      type: 'files'
    }),
  };

  constructor(
    private api: ResourceApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loadData();
  }

  ngOnInit() {
  }

  loadData() {
    this.isDataLoaded = false;
    this.route.params.subscribe(params => {
      const resourceId = params['resource'];
      this.category = params['category'];

      if (resourceId) {
        this.createNew = false;
        this.loadAllCategories(() => {
          this.api
            .getResource(resourceId)
            .subscribe(resource => {
              this.resource = resource;
              this.loadResourceCategories(resource, () => this.loadForm());
            });
        });
      } else {
        this.createNew = true;
        this.resource = { id: null, name: '', description: '', availabilities: [] };
        this.loadAllCategories(() => this.loadForm());
      }
    });
  }

  loadAllCategories(callback: Function) {
    const leafCats = function (cats, result = []) {
      for (const c of cats) {
        if (Array.isArray(c.children) && (c.children.length > 0)) {
          result = leafCats(c.children, result);
        } else {
          result.push(c);
        }
      }
      return result;
    };

    this.api.getCategories().subscribe(categories => {
      this.allCategories = leafCats(categories);
      callback();
    });
  }

  loadResourceCategories(resource: Resource, callback: Function) {
    this.api
      .getResourceCategories(resource)
      .subscribe(rcs => {
        this.resourceCategories = rcs;
        callback();
      });
  }

  loadFieldsets() {
    this.fieldsets = [];

    // Loop through each form field
    for (const fieldName in this.fields) {
      if (this.fields.hasOwnProperty(fieldName)) {
        const field = this.fields[fieldName];

        // If fieldset id is different from current, create new fieldset
        if (
          (this.fieldsets.length === 0) ||
          (this.fieldsets[this.fieldsets.length - 1].id !== field.fieldsetId)
        ) {
          this.fieldsets.push(new Fieldset({
            id: field.fieldsetId || Math.random().toString(),
            label: field.fieldsetLabel || null,
            fields: []
          }));
        }

        // Add the field to the fieldset
        this.fieldsets[this.fieldsets.length - 1].fields.push(field);
      }
    }
  }

  loadForm() {
    this.isDataLoaded = false;

    for (const fieldName in this.fields) {
      if (this.fields.hasOwnProperty(fieldName)) {
        const field = this.fields[fieldName];
        const validators = [];

        if (field.required) {
          validators.push(Validators.required);
        }

        if (field.minLength) {
          validators.push(Validators.minLength(field.minLength));
        }

        if (field.maxLength) {
          validators.push(Validators.maxLength(field.maxLength));
        }

        if (field.type === 'email') {
          validators.push(Validators.email);
        }

        if (field.type === 'url') {
          validators.push(ValidateUrl);
        }

        if (fieldName === 'categories') {
          const selectedCatIds = this.resourceCategories.map(rc => rc.category.id);
          selectedCatIds.push(+this.category);

          for (const cat of this.allCategories) {
            const checked = selectedCatIds.includes(cat.id);
            const control = new FormControl();
            control.setValue(checked);
            this.fields.categories.formGroup.addControl(cat.id.toString(), control);
          }

          this.fields.categories.formGroup.setValidators(validators);
          this.resourceForm.addControl(fieldName, this.fields.categories.formGroup);
          this.isDataLoaded = true;
        } else {
          if (field.formControl) {
            field.formControl.setValidators(validators);

            if (fieldName === 'availabilities.institution_id') {
              const selectedInstitutions = this.resource.availabilities.filter(av => av.available);
              const selectedInstitutionIds = selectedInstitutions.map(i => i.institution_id);
              field.formControl.patchValue(selectedInstitutionIds);
            } else {
              field.formControl.patchValue(this.resource[fieldName]);
            }

            this.resourceForm.addControl(fieldName, field.formControl);
          }
        }
      }
    }

    if (!this.createNew) {
      this.validate();
    }

    this.loadFieldsets();
  }

  getFields(): FormField[] {
    const fields = [];

    for (const fieldName in this.fields) {
      if (this.fields.hasOwnProperty(fieldName)) {
        fields.push(this.fields[fieldName]);
      }
    }

    return fields;
  }

  closeIfComplete() {
    this.savesInAction--;
    console.log('Total Saves in action:', this.savesInAction);
    if (this.savesInAction === 0) {
      this.close();
    }
  }

  onSubmit($event) {
    $event.preventDefault();
    this.validate();

    console.log('this.resourceForm', this.resourceForm);


    if (this.resourceForm.valid) {
      this.isDataLoaded = false;

      for (const fieldName in this.fields) {
        if (this.fields[fieldName].formControl) {
          this.resource[fieldName] = this.fields[fieldName].formControl.value;
        }
      }

      const fnName = this.createNew ? 'addResource' : 'updateResource';

      if (this.hasAttachments()) {
        this.api[fnName](this.resource)
          .pipe(
            map(r => this.resource = r),
            switchMap(() => this.updateAvailabilities()),
            switchMap(() => this.updateAttachments()),
            switchMap((ras = []) => ras.map(ra => this.updateAttachmentFiles(ra)))
          )
          .subscribe(
            result => console.log('result', result),
            error => console.error(error),
            () => this.close()
          );
      } else {
        this.api[fnName](this.resource)
          .pipe(
            map(r => this.resource = r),
            switchMap(() => this.updateAvailabilities()),
          )
          .subscribe(
            result => console.log('result', result),
            error => console.error(error),
            () => this.close()
          );
      }


    } else {
      console.log('FORM NOT VALID');
    }
  }

  updateCategories() {
    const selectedCategories = [];
    const controls = this.fields.categories.formGroup.controls;

    for (const key in controls) {
      if (controls.hasOwnProperty(key) && controls[key].value) {
        selectedCategories.push({ resource_id: this.resource.id, category_id: parseInt(key, 10) });
      }
    }
    return this.api
      .updateResourceCategories(this.resource, selectedCategories)
      .toPromise();
  }

  updateAvailabilities() {
    console.log('=== updateAvailabilities ===');

    const availabilities: Availability[] = [];
    for (const value of this.fields['availabilities.institution_id'].formControl.value || []) {
      availabilities.push({ resource_id: this.resource.id, institution_id: value, available: true });
    }
    return this.api.updateResourceAvailability(this.resource, availabilities);
  }

  updateAttachments() {
    console.log('=== updateAttachments ===');

    if (this.hasAttachments()) {
      this.fields.attachments.files.forEach(f => this.files[f.name] = f);

      console.log('this.files', this.files);
      const filenames = Object.keys(this.files);
      console.log('filenames', filenames);

      return this.api.addResourceAttachment(this.resource.id, filenames);
    }
  }

  updateAttachmentFiles(ra: ResourceAttachment) {
    console.log('=== updateAttachmentFiles ===');

    return this.api.addResourceAttachmentFile(ra, this.files[ra.name]);
  }

  onCancel() {
    this.close();
  }

  validate() {
    for (const key in this.resourceForm.controls) {
      if (this.resourceForm.controls.hasOwnProperty(key)) {
        const control = this.resourceForm.controls[key];
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    }
  }

  showDelete() {
    this.showConfirmDelete = true;
  }

  onDelete() {
    this.api.deleteResource(this.resource).subscribe(r => {
      this.close();
    },
      error => this.error = error
    );
  }

  // Go to resource screen
  close() {
    console.log('=== close ===');

    if (this.resource && this.resource.id) {
      this.router.navigate(['resource', this.resource.id]);
    } else {
      this.route.params.subscribe(params => {
        const resourceId = params['resource'];
        const categoryId = params['category'];

        if (resourceId) {
          this.router.navigate(['resource', resourceId]);
        } else if (categoryId) {
          this.router.navigate(['category', categoryId]);
        }
      });
    }
  }

  getFieldErrors(field: FormField) {
    if (field.formControl) {
      return field.formControl.errors;
    } else if (field.formGroup) {
      return field.formGroup.errors;
    }
  }

  hasAttachments() {
    return (
      this.fields.attachments &&
      this.fields.attachments.files &&
      (this.fields.attachments.files.length > 0)
    );
  }
}
