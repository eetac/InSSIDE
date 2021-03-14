import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/services/authentication.service';
import { CaseService } from 'src/services/case.service';
const forge = require('node-forge');
const pki = forge.pki;
const rsa = forge.pki.rsa;
const Buffer = require('buffer/').Buffer;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Table
  headers = ['Property', 'Sensitive Data'];
  decryptedData = {};

  hidePrivKey: boolean;
  /* public sensitiveData = ["firstName","middleName","lastName","addresses,phoneNumber"] */
  userActive: boolean;
  decryptForm: FormGroup;
  transferForm: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private caseService: CaseService
  ) { }

  ngOnInit(): void {
    this.userStatus();
    this.decryptForm = this.formBuilder.group({
      caseId: ['', [Validators.required]]
    });
    this.transferForm = this.formBuilder.group({
      emailToTransfer: ['', [Validators.required]]
    });
  }

  get fdecryptForm() { return this.decryptForm.controls; }
  get ftransferForm() { return this.transferForm.controls; }

  userStatus() {

    const userData = this.authenticationService.currentUserValue;
    if (userData == null) {
      this.userActive = false;
    }
    else {
      this.userActive = true;
    }
  }
  copyToClipboard() {

  }
  decryptCase() {
    if (this.fdecryptForm.caseId.value !== '' ) {

      const email = this.authenticationService.currentUserValue.email;
      // tslint:disable-next-line:max-line-length
      this.caseService.getLicense(email, this.fdecryptForm.caseId.value, this.authenticationService.currentUserValue.privateKey).subscribe(data => {
        // FROM LICENSE GET THE SYMMETRIC Key
        console.log(data);
        const license = data.keyUsed;
        console.log(`license:${license}`);
        const symmetricKey = this.decryptKeyRSA(this.authenticationService.currentUserValue.privateKey, license);
        // TODO : Decrypt the case, already contained in the message. #Later substitute with html injected
        
      },
      error => {
        console.log(error);
        alert(error.error.error.message);
      }
      );
    }
    else {
      alert('Error: caseId Required');
    }
  }
  decryptKeyRSA(privateKeyPem: string, encryptedData: string): string{
      const privateKey = pki.privateKeyFromPem(privateKeyPem);
      console.log(`Private Key Pem Format: `, privateKeyPem);
      console.log('Private Key: ', privateKey);
      // decrypt data with a private key using RSAES-OAEP padding/SHA-256 verification hash
    // @ts-ignore
      const decrypted = privateKey.decrypt(new Buffer(encryptedData, 'base64'), 'RSA-OAEP', {
        md: forge.md.sha256.create()
      });
      console.log('Symmetric License Key', decrypted);
      return decrypted;
  }

  shareAccessToHospitals(){
    if ((this.fdecryptForm.caseId.value !== '') && (this.ftransferForm.emailToTransfer.value !== '')) {
      const email = JSON.parse(localStorage.getItem('user')).email;
      console.log('email: ' + email + ' emailToTransfer: ' + this.ftransferForm.emailToTransfer.value);
      const transferPermissionJSON = {
        email,
        hashId: this.fdecryptForm.caseId.value,
        emailToTransfer: this.ftransferForm.emailToTransfer.value
      };
      /* this.initService.transferKey(transferPermissionJSON).subscribe(
        data => {
          console.log('RECEIVED');
          const res = JSON.stringify(data);
          alert('Case license transfer sucessfull!');
       },
       error => {
           alert(error.message);
       }); */
    }
    else {
      alert('Error: caseId and Destination Hospital Required');
    }
  }
}
