import { Component } from '@angular/core';
import { AuthenticationService } from 'src/services/authentication.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GoData Anonymization';
  userActive: boolean;
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
    ) {
    this.userStatus();
  }

  logout(){
    this.authenticationService.logout();
  }
  userStatus(){
    const userData = this.authenticationService.currentUserValue;
    if (userData == null){
      this.userActive = false;
      this.router.navigate(['/login']);
    }
    else{
      this.userActive = true;
      this.router.navigate(['/home']);
    }
  }
}

