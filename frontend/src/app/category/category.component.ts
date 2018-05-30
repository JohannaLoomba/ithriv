import { Component, OnInit } from '@angular/core';
import {Category} from '../category';
import {Resource} from '../resource';
import {ResourceApiService} from '../resource-api.service';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {

  categoryId: number;
  category: Category;
  resources: Resource[];
  isDataLoaded = false;


  constructor(private router: Router,
              private route: ActivatedRoute,
              private api: ResourceApiService) {

    this.route.params.subscribe( params => {
      this.categoryId = params['category'];
      this.loadCategory(this.categoryId);
    });

  }

  loadCategory(categoryId: Number) {
    this.api.getCategory(categoryId).subscribe(
      (category) => {
        this.category = category;
        this.api.getCategoryResources(this.category).subscribe(
          (resources) => {
            this.resources = resources;
            this.isDataLoaded = true;
          }
        );
      }
    );
  }

  ngOnInit() {
  }

}