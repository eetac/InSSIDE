import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      privateKey:['',[Validators.required]]
    });
  }
  // Returns directly the controls of the form
  get f() { return this.loginForm.controls; }

  login() {
      this.submitted = true;

      // stop here if form is invalid
      if (this.loginForm.invalid) {
          return;
      }

      this.loading = true;
      /* let loginJSON = {
        username: this.f.username.value,
        password: this.f.password.value
      } */
      const username = this.f.username.value;
      const password = this.f.password.value;
      const privateKey = this.f.privateKey.value;
      this.authenticationService.login(this.f.username.value,this.f.password.value,this.f.privateKey.value).subscribe(user=>{
        this.router.navigate(['/home'])
        this.loading = false;
      },
      error=>{
        console.log(error);
        alert(error.error.message);
        this.loading = false;
      }
      );
      /* this.initService.login(loginJSON).subscribe(
         data => {
          console.log(data.status);
           console.log(data);
          let storedJSON = JSON.stringify(loginJSON);
          localStorage.setItem('user',storedJSON);
          this.router.navigate(['/home']);
        },
        error => {
            alert(error.message);
            this.loading = false;
        }); */
  }

}
