import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Rooturl } from './rooturl';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  rooturl: Rooturl;
  constructor(private http: HttpClient,private router: Router) { 

  }
  getLicense(email, caseId:string,privateKey) {
    return this.http.post<any>(`${environment.apiUrl}/drm/getLicense`, { email, caseId,privateKey })
    .pipe(map(data => {
      //Returns a Java Object mapped!
      return data;
    }));
  }
  
  transferLicense(email:string,emailToTransfer:string, caseId:string) {
    return this.http.post<any>(`${environment.apiUrl}/drm/transferLicense`, { email,emailToTransfer, caseId })
    .pipe(map(data => {
      //Returns a Java Object mapped!
      return data;
    }));
  }
  
}
