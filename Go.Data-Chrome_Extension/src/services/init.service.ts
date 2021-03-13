import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Rooturl } from './rooturl';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from './../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InitService {
  rooturl: Rooturl;

  constructor(private http: HttpClient,private router: Router) {
    this.rooturl = new Rooturl();
  }
  
  getKey(body: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/key`, body);
  }
 
  transferKey(body: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/transferKey`, body);
  }
  
}