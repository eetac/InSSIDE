import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InitService } from 'src/services/init.service';
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
    private initService: InitService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required,Validators.email],
      password: ['', Validators.required],
      privateKey: ['',Validators.required]
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
      let loginJSON = {
        username: this.f.username.value,
        password: this.f.password.value
      }
      let key = this.f.privateKey.value;
      localStorage.setItem('key',key);
      this.initService.login(loginJSON).subscribe(
         data => {
             let storedJSON = JSON.stringify(loginJSON)
             localStorage.setItem('user',storedJSON);
          this.router.navigate(['/home'])
        },
        error => {
            alert(error.message);
            this.loading = false;
        });
  }

}
