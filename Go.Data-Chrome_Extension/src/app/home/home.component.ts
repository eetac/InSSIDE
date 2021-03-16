/* tslint:disable:no-trailing-whitespace */
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'src/services/authentication.service';
import {CaseService} from 'src/services/case.service';
import {CryptographyService} from 'src/services/cryptography.service';
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Table
  headers = ['Personal', 'Information'];
  decryptedData = {};
  userActive: boolean;
  decryptedDataAvailable = false;
  decryptForm: FormGroup;
  transferForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private caseService: CaseService,
    private cryptographyService: CryptographyService
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

            environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Case Page') : alert('Error: Not GoData Case Page');

          }
        }else{
          environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Case Page') : alert('Error: Not GoData Case Page');
        }
      }else{
        environment.isExtensionBuild ? this.alertChromeTab('Error: Not GoData Case Page') : alert('Error: Not GoData Case Page');
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
            this.injectValues(decryptedCase);
          }catch (e) {
            environment.isExtensionBuild ? this.alertChromeTab('Error: License/Case are bad.') : alert('Error: License/Case are bad.');
          }
        }catch (e) {
          environment.isExtensionBuild ? this.alertChromeTab('Error: Private Key Incorrect and/or format.') : alert('Error: Private Key Incorrect and/or format.');
          this.authenticationService.logout();
        }
      },
      error => {
        console.log(error);
        environment.isExtensionBuild ? this.alertChromeTab(error.error.error.message) : alert(error.error.error.message);
      }
    );
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
      // @ts-ignore First Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-1").value="${decryptedFields.firstName}";` }
      );
      // @ts-ignore Middle Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-2").value="${decryptedFields.middleName}";` }
      );
      // @ts-ignore Last Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-3").value="${decryptedFields.lastName}";` }
      );
      // @ts-ignore CIP
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-35").value="${decryptedFields.CIP}";` }
      );
      // @ts-ignore National Id Card
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-36").value="${decryptedFields.NATIONALIDCARD}";` }
      );
      // @ts-ignore Phone Number
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-45").value="${decryptedFields.phoneNumber}";` }
      );
      // TWO VERSIONS OF ANGULAR ARE CREATED FOR GO DATA WEBPAGE, THUS TWO MODES OF JQUERY REQUIRED
      // @ts-ignore First Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-76").value="${decryptedFields.firstName}";` }
      );
      // @ts-ignore Middle Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-77").value="${decryptedFields.middleName}";` }
      );
      // @ts-ignore Last Name
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-78").value="${decryptedFields.lastName}";` }
      );
      // @ts-ignore CIP
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-110").value="${decryptedFields.CIP}";` }
      );
      // @ts-ignore National Id Card
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-111")="${decryptedFields.NATIONALIDCARD}";` }
      );
      // @ts-ignore Phone Number
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `document.querySelector("#mat-input-120")="${decryptedFields.phoneNumber}";` }
      );
    } );
  }

  decryptCaseFields(symmetricKey: string, spCase: any): any{

    // TODO: Decrypt all of the fields found in the caseEncrypted, decrypt and return it!
    // tslint:disable-next-line:prefer-const
    let decryptedCaseWithSensitiveFields = {};
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
              if (!(subSensitiveField[0] === 'documents' && spCaseSubObject.type.toString() === 'LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID')) {
                const sensitiveFieldValueSplit = spCaseSubObject[subSensitiveField[1]].split('/');
                const offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                const encryptedFieldValue = spCaseSubObject[subSensitiveField[1]].substring(offsetEncryptedFieldValue, );
                if (sensitiveFieldValueSplit[1] === 'ENC') { // if is encrypted
                  const decryptedField: string = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
                  // spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
                  if (subSensitiveField[0] === 'documents') {
                    const documentTypeSplit = spCaseSubObject.type.split('_');
                    const documentType = documentTypeSplit.splice(6, documentTypeSplit.length - 1).join('');
                    decryptedCaseWithSensitiveFields[documentType] = decryptedField;
                  } else {
                    decryptedCaseWithSensitiveFields[subSensitiveField[1]] = decryptedField;
                  }
                }
              }
            });
          } else {
            console.log(`${subSensitiveField[0]} is null, not decrypting this field!`);
          }
      }
    });
    return decryptedCaseWithSensitiveFields;
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
