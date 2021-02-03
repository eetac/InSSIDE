import { Component } from '@angular/core';
import { InitService } from 'src/services/init.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Go.Data Chrome Extension';
  userActive:boolean;
  constructor(private initService: InitService) { 
    this.userStatus()
  }

  logout(){
    this.initService.logout();
  }
  userStatus(){
    let userData = JSON.parse(localStorage.getItem('user'));
    let key = JSON.parse(localStorage.getItem('key'))
    if(userData == null || key == null){
      this.userActive = false
    }
    else{
      this.userActive = true

    }
  }
}

