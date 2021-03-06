import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgressComponent } from '@ngx-progressbar/core';
import { Observable, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { catchError, last, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Availability } from '../../availability';
import { Category } from '../../category';
import { CategoryResource } from '../../category-resource';
import { Favorite } from '../../favorite';
import { FileAttachment } from '../../file-attachment';
import { Icon } from '../../icon';
import { Institution } from '../../institution';
import { Resource } from '../../resource';
import { ResourceAttachment } from '../../resource-attachment';
import { ResourceCategory } from '../../resource-category';
import { ResourceQuery } from '../../resource-query';
import { ResourceType } from '../../resourceType';
import { User } from '../../user';
import { UserSearchResults } from '../../user-search-results';
import { ViewPreferences } from '../../view-preferences';

@Injectable()
export class ResourceApiService {

  apiRoot = environment.api;

  // REST endpoints
  endpoints = {
    resourceList: '/api/resource',
    resource: '/api/resource/<id>',
    categoryByResource: '/api/resource/<resource_id>/category',
    categoryList: '/api/category',
    rootCategoryList: '/api/category/root',
    category: '/api/category/<id>',
    resourceByCategory: '/api/category/<category_id>/resource',
    institution: '/api/institution/<id>',
    institutionList: '/api/institution',
    institutionAvailabilityList: '/api/institution/availability',
    type: '/api/type/<id>',
    typeList: '/api/type',
    search: '/api/search',
    resourceAvailabilityList: '/api/resource_institution',
    resourceAvailability: '/api/resource_institution/<id>',
    availabilityList: '/api/availability',
    availability: '/api/availability/<id>',
    fileAttachment: '/api/file/<file_id>', // One file
    fileAttachmentList: '/api/file', // All files
    resourceCategoryList: '/api/resource_category',
    resourceCategory: '/api/resource_category/<id>',
    resourceAttachment: '/api/resource/attachment/<id>', // One attachment
    resourceAttachmentList: '/api/resource/attachment', // All attachments on every resource
    attachmentByResource: '/api/resource/<resource_id>/attachment', // All attachments for given resource
    iconList: '/api/icon',
    icon: '/api/icon/<id>',
    favoriteList: '/api/favorite',
    favorite: '/api/favorite/<id>',
    userFavorites: '/api/session/favorite',
    userResources: '/api/session/resource',
    userList: '/api/user',
    login_password: '/api/login_password',
    forgot_password: '/api/forgot_password',
    reset_password: '/api/reset_password',
    consult_request: '/api/consult_request',
    approval_request: '/api/approval_request',
    session: '/api/session'
  };

  private hasSession: boolean;
  private sessionSubject = new BehaviorSubject<User>(null);

  constructor(
    private httpClient: HttpClient,
    private router: Router
  ) {
    this.getSession().subscribe(); // Try to set up the session when starting up.
  }

  /** getSession */
  public getSession(): Observable<User> {
    if (!this.hasSession && localStorage.getItem('token')) {
      this._fetchSession();
    }
    return this.sessionSubject.asObservable();
  }

  /** _fetchSession */
  public _fetchSession(): void {
    this.httpClient.get<User>(this.apiRoot + this.endpoints.session).subscribe(user => {
      this.hasSession = true;
      this.sessionSubject.next(user);
    }, (error) => {
      localStorage.removeItem('token');
      this.hasSession = false;
      this.sessionSubject.error(error);
    });
  }

  /** openSession */
  openSession(token: string): Observable<User> {
    localStorage.setItem('token', token);
    return this.getSession();
  }

  /** closeSession */
  closeSession(): Observable<User> {
    this.httpClient.delete<User>(this.apiRoot + this.endpoints.session).subscribe(x => {
      localStorage.removeItem('token');
      sessionStorage.clear();
      this.hasSession = false;
      this.sessionSubject.next(null);
    }, (error) => {
      localStorage.removeItem('token');
      sessionStorage.clear();
      this.hasSession = false;
      this.sessionSubject.error(error);
    });
    return this.sessionSubject.asObservable();
  }

  /** loginUser - An alternative to single sign on, allow users to log into the system with a user name and password.
   * email_token is not required, only send this if user is logging in for the first time
   * after an email verification link. */
  login(email: string, password: string, email_token = ''): Observable<any> {
    const options = { email: email, password: password, email_token: email_token };
    return this.httpClient.post(this.apiRoot + this.endpoints.login_password, options)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Something bad happened; please try again later.';

    console.error(error);

    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned a status code ${error.status}, ` +
        `Code was: ${JSON.stringify(error.error.code)}, ` +
        `Message was: ${JSON.stringify(error.error.message)}`);
      message = error.error.message;
      // If this was a 401 error, re-verify they have a valid session.
      if (error.error.code === 401) {
        this._fetchSession();
      }
    }
    // return an observable with a user-facing error message
    // FIXME: Log all error messages to Google Analytics
    return throwError(message);
  }

  /** updateViewPreferences */
  updateViewPreferences(preferences: ViewPreferences) {
    localStorage.setItem('viewPreferences', JSON.stringify(preferences));
  }

  /** getViewPreferences */
  getViewPreferences(): ViewPreferences {
    const viewPrefs = JSON.parse(localStorage.getItem('viewPreferences'));
    if (viewPrefs) {
      return viewPrefs;
    } else {
      // Initialize view preferences
      this.updateViewPreferences({ isNetworkView: true });
      return this.getViewPreferences();
    }
  }

  /** searchResources */
  searchResources(query: ResourceQuery): Observable<ResourceQuery> {
    return this.httpClient.post<ResourceQuery>(this.apiRoot + this.endpoints.search, query)
      .pipe(catchError(this.handleError));
  }

  /** getCategories */
  getCategories(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(this.apiRoot + this.endpoints.categoryList)
      .pipe(catchError(this.handleError));
  }

  /** getRootCategories */
  getRootCategories(): Observable<Category[]> {
    return this.httpClient.get<Category[]>(this.apiRoot + this.endpoints.rootCategoryList)
      .pipe(catchError(this.handleError));
  }

  /** getCategory */
  getCategory(id: Number): Observable<Category> {
    return this.httpClient.get<Category>(`${this.apiRoot + this.endpoints.categoryList}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** getCategoryResources */
  getCategoryResources(category: Category): Observable<CategoryResource[]> {
    return this.httpClient.get<CategoryResource[]>(this.apiRoot + category._links.resources)
      .pipe(catchError(this.handleError));
  }

  /** updateCategory */
  updateCategory(category: Category): Observable<Category> {
    return this.httpClient.put<Category>(this.apiRoot + category._links.self, category)
      .pipe(catchError(this.handleError));
  }

  /** addCategory */
  addCategory(category: Category): Observable<Category> {
    return this.httpClient.post<Category>(this.apiRoot + this.endpoints.categoryList, category)
      .pipe(catchError(this.handleError));
  }

  /** deleteCategory */
  deleteCategory(category: Category): Observable<Category> {
    return this.httpClient.delete<Category>(this.apiRoot + category._links.self)
      .pipe(catchError(this.handleError));
  }

  /** getIcons */
  getIcons(): Observable<Icon[]> {
    return this.httpClient.get<Icon[]>(this.apiRoot + this.endpoints.iconList)
      .pipe(catchError(this.handleError));
  }

  /** getInstitutions */
  getInstitutions(): Observable<Institution[]> {
    return this.httpClient.get<Institution[]>(this.apiRoot + this.endpoints.institutionList)
      .pipe(catchError(this.handleError));
  }

  /** getAvailabilityInstitutions */
  getAvailabilityInstitutions(): Observable<Institution[]> {
    return this.httpClient.get<Institution[]>(this.apiRoot + this.endpoints.institutionAvailabilityList)
      .pipe(catchError(this.handleError));
  }

  /** getInstitution */
  getInstitution(id: Number): Observable<Institution> {
    return this.httpClient.get<Institution>(`${this.apiRoot + this.endpoints.institutionList}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** getTypes */
  getTypes(): Observable<ResourceType[]> {
    return this.httpClient.get<ResourceType[]>(this.apiRoot + this.endpoints.typeList)
      .pipe(catchError(this.handleError));
  }

  /** getResource */
  getResource(id: Number): Observable<Resource> {
    return this.httpClient.get<Resource>(`${this.apiRoot + this.endpoints.resourceList}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** getResources */
  getResources(): Observable<Resource[]> {
    return this.httpClient.get<Resource[]>(this.apiRoot + this.endpoints.resourceList)
      .pipe(catchError(this.handleError));
  }

  /** getResourceCategories */
  getResourceCategories(resource: Resource): Observable<ResourceCategory[]> {
    const url = this.endpoints.categoryByResource.replace('<resource_id>', resource.id.toString());
    return this.httpClient.get<ResourceCategory[]>(this.apiRoot + url)
      .pipe(catchError(this.handleError));
  }

  /** updateResourceCategories */
  updateResourceCategories(resource: Resource, categories: CategoryResource[]): Observable<CategoryResource[]> {
    return this.httpClient.post<CategoryResource[]>(this.apiRoot + resource._links.categories, categories)
      .pipe(catchError(this.handleError));
  }

  /** updateResource */
  updateResource(resource: Resource): Observable<Resource> {
    return this.httpClient.put<Resource>(this.apiRoot + resource._links.self, resource)
      .pipe(catchError(this.handleError));
  }

  /** updateResourceAvailability */
  updateResourceAvailability(resource: Resource, avails: Availability[]): Observable<Availability> {
    return this.httpClient.post<Availability>(this.apiRoot + resource._links.availability, avails)
      .pipe(catchError(this.handleError));
  }

  /** addResource */
  addResource(resource: Resource): Observable<Resource> {
    return this.httpClient.post<Resource>(this.apiRoot + this.endpoints.resourceList, resource)
      .pipe(catchError(this.handleError));
  }

  /** linkResourceAndCategory */
  linkResourceAndCategory(resource: Resource, category: Category): Observable<ResourceCategory> {
    const options = { resource_id: resource.id, category_id: category.id };
    return this.httpClient.post<ResourceCategory>(this.apiRoot + this.endpoints.resourceCategoryList, options)
      .pipe(catchError(this.handleError));
  }

  /** unlinkResourceAndCategory */
  unlinkResourceAndCategory(rc: ResourceCategory): Observable<ResourceCategory> {
    return this.httpClient.delete<ResourceCategory>(this.apiRoot + rc._links.self)
      .pipe(catchError(this.handleError));
  }

  /** linkResourceAndAttachment */
  linkResourceAndAttachment(resource: Resource, attachment: FileAttachment): Observable<ResourceAttachment> {
    const options = { resource_id: resource.id, attachment_id: attachment.id };
    return this.httpClient.post<ResourceAttachment>(this.apiRoot + this.endpoints.resourceAttachmentList, options)
      .pipe(catchError(this.handleError));
  }

  /** unlinkResourceAndAttachment */
  unlinkResourceAndAttachment(rc: ResourceAttachment): Observable<ResourceAttachment> {
    return this.httpClient.delete<ResourceAttachment>(this.apiRoot + rc._links.self)
      .pipe(catchError(this.handleError));
  }

  /** deleteResource */
  deleteResource(resource: Resource): Observable<Resource> {
    return this.httpClient.delete<Resource>(this.apiRoot + resource._links.self)
      .pipe(catchError(this.handleError));
  }

  /** getResourceAttachments */
  getResourceAttachments(): Observable<ResourceAttachment[]> {
    return this.httpClient.get<ResourceAttachment[]>(this.apiRoot + this.endpoints.resourceAttachmentList)
      .pipe(catchError(this.handleError));
  }

  /** getResourceAttachment */
  getResourceAttachment(attachment: ResourceAttachment): Observable<ResourceAttachment> {
    const url = this.endpoints.resourceAttachment.replace('<id>', attachment.id.toString());
    return this.httpClient.get<ResourceAttachment>(this.apiRoot + url)
      .pipe(catchError(this.handleError));
  }

  /** getAttachmentsByResources */
  getAttachmentsByResources(resource: Resource): Observable<ResourceAttachment[]> {
    return this.httpClient.get<ResourceAttachment[]>(this.apiRoot + resource._links.attachments)
      .pipe(catchError(this.handleError));
  }

  /** updateResourceAttachment */
  updateResourceAttachment(attachment: ResourceAttachment): Observable<ResourceAttachment> {
    const url = this.endpoints.resourceAttachment.replace('<id>', attachment.id.toString());
    return this.httpClient.put<ResourceAttachment>(this.apiRoot + url, attachment)
      .pipe(catchError(this.handleError));
  }

  /** addResourceAttachment */
  addResourceAttachment(resourceId: Number, filenames: string[]): Observable<ResourceAttachment[]> {
    const url = this.endpoints.attachmentByResource.replace('<resource_id>', resourceId.toString());
    const options = { filenames: filenames };
    return this.httpClient.post<ResourceAttachment[]>(this.apiRoot + url, options)
      .pipe(catchError(this.handleError));
  }

  /** getFileAttachment */
  getFileAttachment(id?: number, md5?: string): Observable<FileAttachment> {
    const params = { id: String(id), md5: md5 };
    const url = this.apiRoot + this.endpoints.fileAttachmentList;

    return this.httpClient.get<FileAttachment>(url, { params: params })
      .pipe(catchError(this.handleError));
  }

  /** addFileAttachment */
  addFileAttachment(attachment: FileAttachment): Observable<FileAttachment> {
    const url = this.apiRoot + this.endpoints.fileAttachmentList;
    const attachmentMetadata = {
      file_name: attachment.name,
      display_name: attachment.name,
      date_modified: new Date(attachment.lastModified),
      md5: attachment.md5,
      mime_type: attachment.type,
      size: attachment.size
    };

    return this.httpClient.post<FileAttachment>(url, attachmentMetadata)
      .pipe(catchError(this.handleError));
  }

  /** addFileAttachmentBlob */
  addFileAttachmentBlob(attachmentId: number, attachment: FileAttachment, progress: NgProgressComponent): Observable<FileAttachment> {
    const url = this.endpoints.fileAttachment.replace('<file_id>', attachmentId.toString());
    const options: {
      headers?: HttpHeaders,
      observe: 'events',
      params?: HttpParams,
      reportProgress?: boolean,
      responseType: 'json',
      withCredentials?: boolean
    } = {
      observe: 'events',
      reportProgress: true,
      responseType: 'blob' as 'json'
    };

    return this.httpClient.put<File>(this.apiRoot + url, attachment, options)
      .pipe(
        map(event => this.showProgress(event, attachment, progress)),
        last(), // return last (completed) message to caller
        catchError(this.handleError)
      );
  }

  /** updateFileAttachment */
  updateFileAttachment(attachment: FileAttachment): Observable<FileAttachment> {
    const url = this.endpoints.fileAttachment.replace('<file_id>', attachment.id.toString());
    const attachmentMetadata = {
      display_name: attachment.display_name,
      date_modified: new Date(attachment.lastModified || attachment.date_modified),
      md5: attachment.md5,
      mime_type: attachment.type || attachment.mime_type,
      size: attachment.size,
      resource_id: attachment.resource_id
    };

    return this.httpClient.put<FileAttachment>(this.apiRoot + url, attachmentMetadata)
      .pipe(catchError(this.handleError));
  }

  /** getFileAttachmentBlob*/
  getFileAttachmentBlob(attachment: FileAttachment): Observable<Blob> {
    const options: {
      headers?: HttpHeaders,
      observe?: 'body',
      params?: HttpParams,
      reportProgress?: boolean,
      responseType: 'json',
      withCredentials?: boolean,
    } = {
      responseType: 'blob' as 'json'
    };

    return this.httpClient.get<Blob>(attachment.url, options)
      .pipe(catchError(this.handleError));
  }

  /** deleteFileAttachment */
  deleteFileAttachment(attachment: FileAttachment): Observable<FileAttachment> {
    const url = this.endpoints.fileAttachment.replace('<file_id>', attachment.id.toString());
    return this.httpClient.delete<FileAttachment>(this.apiRoot + url)
      .pipe(catchError(this.handleError));
  }

  /** getUserResources
   * get resources that the user owns */
  getUserResources(): Observable<Resource[]> {
    return this.httpClient.get<Resource[]>(this.apiRoot + this.endpoints.userResources)
      .pipe(catchError(this.handleError));
  }

  /** addFavorite */
  addFavorite(user: User, resource: Resource): Observable<Favorite> {
    const options = { resource_id: resource.id, user_id: user.id };
    return this.httpClient.post<Favorite>(this.apiRoot + this.endpoints.favoriteList, options)
      .pipe(catchError(this.handleError));
  }

  /** deleteFavorite */
  deleteFavorite(favorite: Favorite): Observable<Favorite> {
    return this.httpClient.delete<Favorite>(this.apiRoot + favorite._links.self)
      .pipe(catchError(this.handleError));
  }

  /** getUserFavorites */
  getUserFavorites(): Observable<Favorite[]> {
    return this.httpClient.get<Favorite[]>(this.apiRoot + this.endpoints.userFavorites)
      .pipe(catchError(this.handleError));
  }

  /** getUser
   * retrieve a user */
  getUser(id: number): Observable<User> {
    return this.httpClient.get<User>(this.apiRoot + this.endpoints.userList + '/' + id)
      .pipe(catchError(this.handleError));
  }

  /** updateUser */
  updateUser(user: User): Observable<User> {
    return this.httpClient.put<User>(this.apiRoot + user._links.self, user)
      .pipe(catchError(this.handleError));
  }

  /** addUser */
  addUser(user: User): Observable<User> {
    return this.httpClient.post<User>(this.apiRoot + this.endpoints.userList, user)
      .pipe(catchError(this.handleError));
  }

  /** deleteUser */
  deleteUser(user: User): Observable<User> {
    return this.httpClient.delete<User>(this.apiRoot + user._links.self)
      .pipe(catchError(this.handleError));
  }

  /** findUsers */
  findUsers(filter = '', sort = 'display_name', sortOrder = 'asc', pageNumber = 0, pageSize = 3): Observable<UserSearchResults> {
    const search_data = { filter: filter, sort: sort, sortOrder: sortOrder, pageNumber: String(pageNumber), pageSize: String(pageSize) };
    return this.httpClient.get<UserSearchResults>(this.apiRoot + this.endpoints.userList, { params: search_data })
      .pipe(catchError(this.handleError));
  }

  /** sendResetPasswordEmail
   * Reset password */
  sendResetPasswordEmail(email: String): Observable<any> {
    const email_data = { email: email };
    return this.httpClient.post<any>(this.apiRoot + this.endpoints.forgot_password, email_data)
      .pipe(catchError(this.handleError));
  }

  /** resetPassword
   * Reset password */
  resetPassword(newPassword: string, email_token: string): Observable<string> {
    const reset = { password: newPassword, email_token: email_token };
    return this.httpClient.post<string>(this.apiRoot + this.endpoints.reset_password, reset)
      .pipe(catchError(this.handleError));
  }

  /** sendConsultRequestEmail
   * Request a Consult */
  sendConsultRequestEmail(user: User, request_category: string, request_text: string): Observable<any> {
    const request_data = { user_id: user.id, request_category: request_category, request_text: request_text };
    return this.httpClient.post<any>(this.apiRoot + this.endpoints.consult_request, request_data)
      .pipe(catchError(this.handleError));
  }

  /** sendApprovalRequestEmail
   * Request Resource Approval */
  sendApprovalRequestEmail(user: User, resource: Resource): Observable<any> {
    const request_data = { user_id: user.id, resource_id: resource.id };
    return this.httpClient.post<any>(this.apiRoot + this.endpoints.approval_request, request_data)
      .pipe(catchError(this.handleError));
  }

  /** showProgress
   * Return distinct message for sent, upload progress, & response events */
  private showProgress(event: HttpEvent<any>, attachment: FileAttachment, progress: NgProgressComponent): FileAttachment {
    switch (event.type) {
      case HttpEventType.Sent:
        progress.start();
        break;
      case HttpEventType.UploadProgress:
        progress.set(Math.round(100 * event.loaded / event.total));
        break;
      case HttpEventType.DownloadProgress:
        progress.set(Math.round(100 * event.loaded / event.total));
        break;
      case HttpEventType.Response:
        progress.complete();
        return attachment;
      default:
        break;
    }
  }
}


