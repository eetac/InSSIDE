import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Rooturl } from './rooturl';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class InitService {
  rooturl: Rooturl;

  constructor(private http: HttpClient,private router: Router) {
    this.rooturl = new Rooturl();
  }
  register(body: any): Observable<any> {
    return this.http.post("http://localhost:4000/drm/register", body);
  }
  login(body: any): Observable<any> {
    return this.http.post("http://localhost:4000/drm/login", body);
  }
  getKey(body: any): Observable<any> {
    return this.http.post("http://localhost:4000/drm/key", body);
  }
  decryptCase(body: any): Observable<any> {
    return this.http.post("http://localhost:4000/decrypt", body);
  }
  transferKey(body: any): Observable<any> {
    return this.http.post("http://localhost:4000/drm/transferKey", body);
  }
  //Here we delate all the local storage of the user
  logout() {
    let userData = JSON.parse(localStorage.getItem('user'));
    console.log(userData);
    localStorage.removeItem('user');
    localStorage.removeItem('key')
    this.router.navigate(['/'])
  }
}