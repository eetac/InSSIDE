/* tslint:disable:no-trailing-whitespace */
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'src/services/authentication.service';
import {CaseService} from 'src/services/case.service';
import {CryptographyService} from 'src/services/cryptography.service';
import {environment} from '../../environments/environment';
import {MatSnackBar} from "@angular/material/snack-bar";
/*import {MatSnackBar} from '@angular/material/snack-bar';*/

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Table
  headers = ['Personal', 'Information'];
  decryptedData = {};
  injectionDecryptedData = {};
  userActive: boolean;
  decryptedDataAvailable = false;
  decryptForm: FormGroup;
  transferForm: FormGroup;
  hasPermissions = true;
  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private caseService: CaseService,
    private cryptographyService: CryptographyService,
    private snackBar: MatSnackBar
  ) {
    console.log('ran');
    if (environment.isExtensionBuild) {
      this.chromeDecryptAndInject();
    }
  }

  ngOnInit(): void {
    this.userStatus();
    this.decryptedDataAvailable = false;
    this.decryptForm = this.formBuilder.group({
      caseId: ['', []]
    });
    this.transferForm = this.formBuilder.group({
      emailToTransfer: ['', [Validators.required, Validators.email]]
    });
  }

  get fdecryptForm() { return this.decryptForm.controls; }
  get ftransferForm() { return this.transferForm.controls; }

  userStatus() {

    const userData = this.authenticationService.currentUserValue;
    this.userActive = userData != null;
  }

  decryptCase(){
    if (this.fdecryptForm.caseId.value !== '' ) {
      this.getCaseAndDecrypt(this.fdecryptForm.caseId.value);
    }else if (environment.isExtensionBuild) {
      this.chromeDecryptAndInject();
    }else{
      environment.isExtensionBuild ? this.alertChromeTab('caseId Required') : alert('CaseId Required');
    }
  }
  chromeDecryptAndInject(){
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      console.log('tabs', tabs);
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log("URL: ", "${url}");` }
      );
      // Separate the string and obtain the caseId
      const UrlSplit = url.split('/');
      if (UrlSplit.length === 6){
        if (UrlSplit[5] === 'view'){
          const caseIdUrl = UrlSplit[4].toString();
          if (caseIdUrl){
            this.fdecryptForm.caseId.setValue(caseIdUrl);
            this.getCaseAndDecrypt(caseIdUrl);
          }else{

            environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Patient Case Page') : alert('Error: Not GoData Case Page');

          }
        }else{
          environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Patient Case Page') : alert('Error: Not GoData Case Page');
        }
      }else{
        environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Patient Case Page') : alert('Error: Not GoData Case Page');
      }
    } );
  }
  getCaseAndDecrypt(caseId) {
    const email = this.authenticationService.currentUserValue.email;
    const privateKey = this.authenticationService.currentUserValue.privateKey;
      // tslint:disable-next-line:max-line-length
    this.caseService.getLicense(email, caseId).subscribe(
      data => {
        // FROM LICENSE GET THE SYMMETRIC Key & Decrypt the case and inject+Show
        console.log(data);
        const encryptedLicense = data.keyUsed;
        console.log(`Encrypted license: ${encryptedLicense}`);
        let decryptedLicense;
        try{
          decryptedLicense = this.cryptographyService.decryptLicenseAsymmetric(privateKey, encryptedLicense);
          // DONE : Decrypt the case, already contained in the message. #Later substitute with html injected
          try{
            const decryptedCase = this.decryptCaseFields(decryptedLicense, data.spCase);
            console.log('Decrypted Case', decryptedCase);
            this.decryptedData = decryptedCase;
            this.decryptedDataAvailable = true;
            this.injectValues(this.injectionDecryptedData);
          }catch (e) {
            this.openSnackBar('Error: License/Case are bad.', 'Close', 'error-snackbar');
            // environment.isExtensionBuild ? this.alertChromeTab('Error: License/Case are bad.') : alert('Error: License/Case are bad.');
          }
        }catch (e) {
          this.hasPermissions = false;
          this.openSnackBar('Error: Private Key and/or format incorrect .', 'Close', 'error-snackbar');
          // tslint:disable-next-line:max-line-length
          // environment.isExtensionBuild ? this.alertChromeTab('Error: Private Key Incorrect and/or format.') : alert('Error: Private Key Incorrect and/or format.');
          // this.authenticationService.logout();
        }
      },
      error => {
        console.log(error);
        this.openSnackBar(error.error.error.message, 'Close', 'error-snackbar');
        // environment.isExtensionBuild ? this.alertChromeTab(error.error.error.message) : alert(error.error.error.message);
      }
    );
  }
  openSnackBar(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 9000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [className],
    });
  }
  alertChromeTab(message: string){
    // @ts-ignore
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `alert("${message}");` });
      // use `url` here inside the callback because it's asynchronous!
    } );
  }

  injectValues(decryptedFields){
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      console.log('tabs', tabs);
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log("URL: ", "${url}");` }
      );
      // TODO : LOOP OVER ALL OF THE PROPERTIES IN DECRYPTED FIELD AND USE THAT TO INJECT THE VALUES ON THE GODATA PAGE
      Object.keys(decryptedFields).forEach(function(key,index) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object 
         // REDO 
      // @ts-ignore First Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector('input[name="${key}"]') ? document.querySelector('input[name="${key}"]').value="${decryptedFields[key]}":x=0;` }
      );
    });
    } );
  }

  decryptCaseFields(symmetricKey: string, spCase: any): any{

    // TODO: Decrypt all of the fields found in the caseEncrypted, decrypt and return it!
    // tslint:disable-next-line:prefer-const
    let decryptedCaseWithSensitiveFields = {};
    let decryptedCaseNamed = {};
    // Decrypting
    environment.sensitiveData.forEach(sensitiveField => {
      const subSensitiveField = sensitiveField.split(',');
      console.log('subSensitiveField', subSensitiveField);
      // If there is a document we have address,phoneNumber
      if (subSensitiveField.length === 1) {
        // If the beginning of the value is equal to /ENC/ we decrypt the field
        if (spCase[sensitiveField] != null) {
          // tslint:disable-next-line:triple-equals
          if (spCase[sensitiveField].substring(0, 5) == '/ENC/') {
            const sensitiveFieldValueSplit = spCase[subSensitiveField[0]].split('/');
            const offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
            const encryptedFieldValue = spCase[subSensitiveField[0]].substring(offsetEncryptedFieldValue);
            // let valueToDecrypt = spCase[sensitiveField].substring(42,) //from 42 because after /ENC/ we have the id of the creator
            // spCase[sensitiveField] = decryptedField
            // tslint:disable-next-line:max-line-length
            decryptedCaseWithSensitiveFields[sensitiveField] = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
            decryptedCaseNamed[sensitiveField] =  decryptedCaseWithSensitiveFields[sensitiveField];
          }
        } else {
          console.log(`${sensitiveField} is null, not decrypting this field!`);
        }
      } else {
        // Has sensitiveField configured in config with internal subfields of the objects stored in a array
        // Documents which contains a list of documents such as nationality, archived_id etc, so
        // need to go over each document and encrypt the number of that document which we want to protect
        // Also applies for addresses, which might contain phone and addresses
        // let fieldObjectsLength = spCase[subSensitiveField[0]].length;

          if (spCase[subSensitiveField[0]] != null) {
            spCase[subSensitiveField[0]].forEach((spCaseSubObject: any, index: number) => {
              console.log('subSensitiveField[0]', subSensitiveField[0]);
              if (!(subSensitiveField[0] === 'documents' && spCaseSubObject.type.toString() !== 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID')) {
                const sensitiveFieldValueSplit = spCaseSubObject[subSensitiveField[1]].split('/');
                const offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                const encryptedFieldValue = spCaseSubObject[subSensitiveField[1]].substring(offsetEncryptedFieldValue, );
                if (sensitiveFieldValueSplit[1] === 'ENC') { // if is encrypted
                  const decryptedField: string = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
                  // spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
                  if (subSensitiveField[0] === 'documents') {
                    const documentTypeSplit = spCaseSubObject.type.split('_');
                    const documentType:string = this.properFormatString(documentTypeSplit);
                    decryptedCaseWithSensitiveFields[`documents[${index}][number]`] = decryptedField;
                    decryptedCaseNamed[documentType] = decryptedField;
                    
                  } else {
                    decryptedCaseWithSensitiveFields[subSensitiveField[1]] = decryptedField;
                    decryptedCaseNamed[subSensitiveField[1]] = decryptedField;
                  }
                }
              }
            });
          } else {
            console.log(`${subSensitiveField[0]} is null, not decrypting this field!`);
          }
      }
    });
    this.injectionDecryptedData = decryptedCaseWithSensitiveFields;
    return decryptedCaseNamed;
  }
  properFormatString(textToFormat: Array<string>):string {
    let textFormatted: string = "";
    /* let text1 = textToFormat.splice(6, textToFormat.length - 1).join(''); */
    let textArr1 = textToFormat.splice(6, textToFormat.length - 1);
    let text2 = textArr1.join(' ');
    return text2;
  }
  shareAccessToHospitals(){
    if ((this.fdecryptForm.caseId.value !== '') && (this.ftransferForm.emailToTransfer.value !== '')) {

        const email = this.authenticationService.currentUserValue.email;
        const caseId = this.fdecryptForm.caseId.value;
        const emailToTransfer = this.ftransferForm.emailToTransfer.value;
        this.caseService.transferLicense(email, caseId, emailToTransfer).subscribe(
        data => {
          // FROM LICENSE GET THE SYMMETRIC Key & Decrypt the case and inject+Show
          console.log(data);
          environment.isExtensionBuild ? this.alertChromeTab('Transfer Successful') : alert('Transfer Successful');
        },
        error => {
          console.log(error);
          environment.isExtensionBuild ? this.alertChromeTab(error.error.error.message) : alert(error.error.error.message);
        }
      );
    }
    else {
      environment.isExtensionBuild ? this.alertChromeTab('Error: caseId and Destination Hospital Require') : alert('Error: caseId and Destination Hospital Require');
    }
  }
}
