import { Component, OnInit } from '@angular/core';

import { InitService } from 'src/services/init.service';
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
    private initService: InitService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      contactInfo: ['',Validators.required]
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
    let registerJSON = {
      username: this.f.username.value,
      password: this.f.password.value,
      contactInfo: this.f.contactInfo.value
    }
    this.initService.register(registerJSON).subscribe(
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
      });
}

}
