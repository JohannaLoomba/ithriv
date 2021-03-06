import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { ResourceApiService } from './shared/resource-api/resource-api.service';

@Directive({
  selector: '[appIsAdmin]'
})
export class IsAdminDirective implements OnInit {

  constructor(private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private api: ResourceApiService) {
  }

  ngOnInit(): void {
    this.applyPermission();
  }

  private applyPermission(): void {
    this.api.getSession().subscribe(user => {
      if (user && user.role === 'Admin') {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    },
      error1 => {
        this.viewContainer.clear();
      });
  }
}
