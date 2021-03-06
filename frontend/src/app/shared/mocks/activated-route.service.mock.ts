import { ActivatedRoute } from '@angular/router';
import { SpyObject } from './helper.mock';
import Spy = jasmine.Spy;

export class MockActivatedRoute extends SpyObject {
  urlSpy: Spy;
  paramsSpy: Spy;
  queryParamsSpy: Spy;
  fragmentSpy: Spy;
  dataSpy: Spy;
  fakeResponse: any;

  constructor() {
    super(ActivatedRoute);
    this.fakeResponse = null;
    this.urlSpy = this.spy('url').andReturn(this);
    this.paramsSpy = this.spy('params').andReturn(this);
    this.queryParamsSpy = this.spy('queryParams').andReturn(this);
    this.fragmentSpy = this.spy('fragment').andReturn(this);
    this.dataSpy = this.spy('data').andReturn(this);
  }

  subscribe(callback: any) {
    callback(this.fakeResponse);
  }

  setResponse(json: any): void {
    this.fakeResponse = json;
  }
}
