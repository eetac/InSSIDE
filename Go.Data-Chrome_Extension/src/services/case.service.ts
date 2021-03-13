import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Rooturl } from './rooturl';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/models/user';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  rooturl: Rooturl;
  constructor(private http: HttpClient,private router: Router) { 

  }
  getLicense(username, caseId:string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/license`, { username, caseId })
    .pipe(map(data => {
      //Returns a Java Object mapped!
      return data;
    }));
  }
  
  transferLicense(username:string,usernameToTransfer:string, caseId:string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/transferLicense`, { username,usernameToTransfer, caseId })
    .pipe(map(data => {
      //Returns a Java Object mapped!
      return data;
    }));
  }
  
}
