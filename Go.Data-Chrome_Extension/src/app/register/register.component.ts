import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/services/authentication.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {environment} from '../../environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';
// noinspection JSIgnoredPromiseFromCall
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
    private clipboard: Clipboard
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
    this.authenticationService.register(this.f.email.value, this.f.password.value).subscribe(user => {
     /* const message = `This is your Private Key (store it securely): ${user.privateKey}`;*/
      this.clipboard.copy(user.privateKey);
      this.alertChromeTab('Private Key copied to clipboard, remember to save it!');
      this.loading = false;
      this.router.navigate(['/home']);
    },
    (error) => {
      console.log(error);
      this.alertChromeTab(error.error.error.message);
      this.loading = false;
    }
    );
  }
  /*copyAchievements(message: string) {
    const pending = this.clipboard.beginCopy(message);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
  }*/
  alertChromeTab(message: string){
    // @ts-ignore
    chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs: any) => {
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log("${message}");` });
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `alert("${message}");` });
    } );
  }

}
