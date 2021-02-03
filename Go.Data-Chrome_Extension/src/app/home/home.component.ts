import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InitService } from 'src/services/init.service';
import { bigintToText, textToBigint } from 'bigint-conversion';
import * as bigintCryptoUtils from 'bigint-crypto-utils'
import * as CryptoJS from 'crypto-js'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  //Table
  headers = ["CIP","Fullname","Phone Number"];
  rows = []

  hidePrivKey:boolean;
  public sensitiveData = ["firstName","middleName","lastName","addresses,phoneNumber"]
  userActive: boolean;
  privateKey = "undefined";
  homeForm: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private initService: InitService
  ) { }

  ngOnInit(): void {
   this.hidePrivKey = true;
    this.userStatus()
    this.homeForm = this.formBuilder.group({
      privateKey: ['undefined', [Validators.required]],
      hashCase: ['', [Validators.required]],
      usernameToTranfer: ['',[Validators.required]]
    });
  }

  get f() { return this.homeForm.controls; }

  userStatus() {

    let userData = JSON.parse(localStorage.getItem('user'));
    let key = JSON.parse(localStorage.getItem('key'));
    console.log(key)
    if (userData == null || key == null) {
      this.userActive = false
    }
    else {
      this.userActive = true;
      this.privateKey = localStorage.getItem('key')
    }
  }
  copyToClipboard() {

  }
  getKey() {
    if (this.f.hashCase.value != "") {

      let username = JSON.parse(localStorage.getItem('user')).username
      console.log('USERNAME ' + username)
      let getKeyJSON = {
        username: username,
        hashCase: this.f.hashCase.value,
      }
      this.initService.getKey(getKeyJSON).subscribe(
        data => {
          console.log("RECEIVED")
            let res = JSON.stringify(data)
            console.log(data)
            let key = this.decryptSymKey(data.keyUsed)

            this.decryptCase(key,data)
       },
       error => {
           alert(error.message);
       });
    }
    else {
      alert("Error: Hash Case Required")
    }
  }

  decryptSymKey(keyEncrypted: bigint){
    console.log(keyEncrypted);
    let privUser = JSON.parse(localStorage.getItem('key'));
    let symmetricKey : bigint = bigintCryptoUtils.modPow(keyEncrypted, privUser.privateexp,privUser.publicmod )
    console.log(bigintToText(symmetricKey))
    return bigintToText(symmetricKey);
  }

  decryptCase(key: string, data:any){
    let username;
    if(data.isTheCreator == "y"){
      username = JSON.parse(localStorage.getItem('user')).username
    }
    else{ //If is not the creator we need to split by the email of the creator that is sended from backend
      username = data.emailCreator
    }
   
    console.log(data.spCase)
    this.sensitiveData.forEach(element => {
      var isDocument = element.split(",").length; //If there is a document we have address,phoneNumber
      if (isDocument == 1) {
        //If the beggining of the value is equal to /ENC/ we decrypt the field 
        if (data.spCase[element].substring(0, 5) == "/ENC/") {
          var toSplit = data.spCase[element]; //Because we need to take only the field encrypted not the /ENC/creator
          var splittedField = toSplit.split("/"+username+"/");
          let valueToDecrypt = splittedField[1];
          let decryptedField: String = this.decrypt(valueToDecrypt, key);
          data.spCase[element] = decryptedField
        }
      }
      else {
        if (data.spCase[element.split(",")[0]][0][element.split(",")[1]].substring(0, 5) == "/ENC/") {
          var toSplit = data.spCase[element.split(",")[0]][0][element.split(",")[1]] //Because we need to take only the field encrypted not the /ENC/creator
          var splittedField = toSplit.split("/"+username+"/");
          let valueToDecrypt = splittedField[1]
          let decryptedField: String = this.decrypt(valueToDecrypt, key);
          data.spCase[element.split(",")[0]][0][element.split(",")[1]] = decryptedField
        }
      }
    });
     //Finally decrypt CIP
     let positionCIP: number = 0;
     while (data.spCase["documents"][positionCIP]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP") {
       positionCIP = positionCIP + 1;
     }
     let FullCIPToDecrypt = data.spCase["documents"][positionCIP]["number"]
     var splittedField = FullCIPToDecrypt.split("/"+username+"/");
     let CIPToDecrypt = splittedField[1]
     let decryptedField: String = this.decrypt(CIPToDecrypt, key);
     data.spCase["documents"][positionCIP]["number"] = decryptedField

     //WE ADD IT TO THE TABLE

     this.rows.push({
      "CIP": data.spCase["documents"][positionCIP]["number"],
      "Fullname": data.spCase["firstName"] + data.spCase["middleName"] + data.spCase["lastName"],
      "Phone Number": data.spCase["addresses"][0]["phoneNumber"]
    })

  }
  private decrypt(element: any, key: string): String {
    var decrypted = CryptoJS.AES.decrypt(element, key).toString(CryptoJS.enc.Utf8);
    return decrypted;
  }
  hidePrivateKey(){
    this.hidePrivKey = !this.hidePrivKey
  }

  shareAccesToHospitals(){
    if ((this.f.hashCase.value != "")&&(this.f.usernameToTranfer.value != "")) {
      let username = JSON.parse(localStorage.getItem('user')).username
      console.log('USERNAME ' + username)
      let transferPermissionJSON = {
        username: username,
        hashCase: this.f.hashCase.value,
        usernameToTranfer: this.f.usernameToTranfer.value
      }
      this.initService.transferKey(transferPermissionJSON).subscribe(
        data => {
          console.log("RECEIVED")
            let res = JSON.stringify(data)
            alert("Data Tranfer Succesfully")
       },
       error => {
           alert(error.message);
       });
    }
    else {
      alert("Error: Hash Case and Destination Hospital Required")
    }
  }
}