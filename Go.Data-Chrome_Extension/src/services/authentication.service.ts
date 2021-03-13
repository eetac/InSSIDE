import { environment } from './../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/models/user';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(private http: HttpClient,private router: Router) {
      this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
      this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
      return this.currentUserSubject.value;
  }

  login(email, password, privateKey:string) {
      return this.http.post<any>(`${environment.apiUrl}/drm/login`, { email, password })
          .pipe(map(data => {
            //Add the privateKey to User instance
            console.log("id",data);
            const userCorrect:User = {
              userGoDataId:data.userGoDataId,
              email:email,
              password:password,
              privateKey:privateKey,
              token:"not-implemented"
            }
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem('currentUser', JSON.stringify(userCorrect));
            this.currentUserSubject.next(userCorrect);
            return userCorrect;
          }));
  }

  register(email,password) {
    return this.http.post<any>(`${environment.apiUrl}/drm/register`, { email, password})
    .pipe(map(user => {
        user.password = password;
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
    }));
  }

  logout() {
    // remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    localStorage.removeItem('privateKey')
    this.router.navigate(['/login'])
  }

}
