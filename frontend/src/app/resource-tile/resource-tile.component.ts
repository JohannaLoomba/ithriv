import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Institution } from '../institution';
import { Resource } from '../resource';
import { ResourceType } from '../resourceType';

@Component({
  selector: 'app-resource-tile',
  templateUrl: './resource-tile.component.html',
  styleUrls: ['./resource-tile.component.scss']
})
export class ResourceTileComponent implements OnInit {
  @Input() resource: Resource;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  goResource($event, resource: Resource) {
    $event.preventDefault();
    this.router.navigate(['resource', resource.id]);
  }

  goInstitution($event, institution: Institution) {
    $event.preventDefault();
    this.router.navigateByUrl(`/search/filter?Institution=${institution.name}`);
  }

  goType($event, type: ResourceType) {
    $event.preventDefault();
    this.router.navigateByUrl(`/search/filter?Type=${type.name}`);
  }

  typeIconId(resource: Resource) {
    return resource && resource.type && resource.type.icon && resource.type.icon.id;
  }

  truncateWords(str: string, numWords: number) {
    const maxChars = 36 * 3;
    const allWords = str.split(' ');
    const someWords = allWords.slice(0, numWords);
    if (allWords.length > someWords.length) {
      const someStr = someWords.join(' ');

      if (someStr.length + 3 > maxChars) {
        return this.truncateWords(someStr, numWords - 1);
      } else {
        return someStr + '...';
      }
    } else {
      return str;
    }
  }
}

