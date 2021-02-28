import { Component } from '@angular/core';
import { InitService } from 'src/services/init.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'GoData Anonymization';
  userActive:boolean;
  constructor(private initService: InitService,private router: Router) {
    this.userStatus()
  }

  logout(){
    this.initService.logout();
  }
  userStatus(){
    let userData = JSON.parse(localStorage.getItem('user'));
    if(userData == null){
      this.userActive = false;
    }
    else{
      this.userActive = true;
      this.router.navigate(['/home']);
    }
  }
}

