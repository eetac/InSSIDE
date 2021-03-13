import { Component, OnInit } from '@angular/core';

import { InitService } from 'src/services/init.service';
import { AuthenticationService } from 'src/services/authentication.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
  ) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      email   : ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

   // Returns directly the controls of the form
   get f() { return this.registerForm.controls; }

   register() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
        return;
    }

    this.loading = true;
    /* let registerJSON = {
      email: this.f.username.value,
      password: this.f.password.value,
      contactInfo: this.f.contactInfo.value
    } */
    this.authenticationService.register(this.f.email.value,this.f.password.value).subscribe(user=>{
      alert("This is your Private Key (store it securely): "+ user.privateKey);
      //this.router.navigate(['/home'])
      this.loading = false;
    },
    (error)=>{
      console.log(error)
      alert(error.error.error.message);
      this.loading = false;
    }
    );
    /* this.initService.register(registerJSON).subscribe(
       data => {
       let loginJSON = {
          username: this.f.username.value,
          password: this.f.password.value
        }
        let user = JSON.stringify(loginJSON)
        let publicKey = data.publicKey;
        let privateKey = data.privateKey;
        alert("This is your Private Key (store it securely): "+ privateKey);
        localStorage.setItem('user',user);
        localStorage.setItem('privateKey',privateKey);
        localStorage.setItem('publicKey',publicKey);
        this.router.navigate(['/home'])
      },
      error => {
          alert(error.message);
          this.loading = false;
      }); */
}

}
