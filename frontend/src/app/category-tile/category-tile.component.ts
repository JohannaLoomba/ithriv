import { Component, Input, OnInit, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from '../category';
import { fadeTransition } from '../shared/animations';
import { hexColorToRGBA } from '../shared/color';
import { ResourceApiService } from '../shared/resource-api/resource-api.service';

@Component({
  selector: 'app-category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.scss'],
  animations: [fadeTransition()],
})
export class CategoryTileComponent implements OnInit {
  @HostBinding('@fadeTransition')
  @Input() category: Category;
  @Input() fromCategory: Category;

  constructor(
    private router: Router,
    private api: ResourceApiService
  ) { }

  ngOnInit() {
  }

  goCategory(category: Category) {
    const viewPrefs = this.api.getViewPreferences();
    const isNetworkView = viewPrefs && viewPrefs.hasOwnProperty('isNetworkView') ? viewPrefs.isNetworkView : true;
    const catId = category.id.toString();

    if (isNetworkView) {
      this.router.navigate(['network', catId]);
    } else {
      this.router.navigate(['browse', catId]);
    }
  }

  categoryImageURL() {
    const rootCat = this.category && (this.category.level === 0);
    if (rootCat) {
      return `url('/assets/browse/${this.category.image.replace('.png', '')}-tile.png')`;
    }
  }

  categoryColorLight() {
    return hexColorToRGBA(this.category.color, 0.1);
  }
}
