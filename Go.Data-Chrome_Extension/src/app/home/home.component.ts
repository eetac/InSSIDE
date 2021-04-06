/* tslint:disable:no-trailing-whitespace */
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'src/services/authentication.service';
import {CaseService} from 'src/services/case.service';
import {DomManipulationService} from 'src/services/dom-manipulation.service';
import {CryptographyService} from 'src/services/cryptography.service';
import {environment} from '../../environments/environment';
import {MatSnackBar} from '@angular/material/snack-bar';

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
    private domManipulationService: DomManipulationService,
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
      this.runDecryption(this.fdecryptForm.caseId.value);
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
            // FIXME: CHANGED FROM GET CASE FROM SERVER TO OFFLINE DOM RETRIEVAL
            /*this.getCaseAndDecrypt(caseIdUrl);*/
            this.runDecryption(caseIdUrl);
          }else{
            // tslint:disable-next-line:max-line-length
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
  /**
   * Runs the decryption code, which include the retrieval of encrypted value from webpage,
   * retrieval of license and the decryption of both license and case. And at last presenting them both in the extension and by
   * injecting it onto the webpage.
   * @returns Returns void
   * @krunal
   * @param caseId - string
   */
  runDecryption( caseId: string) {
    const caseData = this.domManipulationService.getCaseFromDOM();
    if (caseData != null) {
      // CaseData retrieved --> Now get the license than decrypt and in last Inject to the page
      // Step1. Get License
      const decryptedLicense = this.getLicenseAndObtainSymmetricKey(caseId);
      // Step2. Decrypt License and obtain symmetric key
      if (decryptedLicense == null) {
        this.openSnackBar('Error: Private key not valid and/or does not has permissions', 'Close', 'error-snackbar');
        return;
      }
      // Step3. Obtain the case values from the webpage
      const spCase = this.domManipulationService.getCaseFromDOM();
      // Step4. Decrypt the case with the symmetric key
      try {
        const decryptedCase = this.decryptCaseFromLicense(decryptedLicense, spCase);
        console.log('Decrypted Case', decryptedCase);
        this.decryptedData = decryptedCase;
        this.decryptedDataAvailable = true;

      } catch (e) {
        this.openSnackBar('Error: License/Case are bad.', 'Close', 'error-snackbar');
      }
      // Step5. Inject the decrypted data to the webpage
      this.domManipulationService.injectValues(this.injectionDecryptedData);
    } else{
    environment.isExtensionBuild ? this.alertChromeTab('Error: Could not read the page contents') : alert('Error: Could not read the page content');
    }
  }

  /**
   * Gets the license from the DRM server and returns the symmetric key by decrypting the
   * license with the private key.
   * @returns Returns the decrypted key else null on error!
   * @krunal
   * @param caseId - string
   */
  getLicenseAndObtainSymmetricKey(caseId: string): any {
    const email = this.authenticationService.currentUserValue.email;
    const privateKey = this.authenticationService.currentUserValue.privateKey;
    // tslint:disable-next-line:max-line-length
    this.caseService.getLicense(email, caseId).subscribe(
      data => {
        // FROM LICENSE GET THE SYMMETRIC Key & Decrypt the case and inject+Show
        console.log(data);
        const encryptedLicense = data.license;
        console.log(`Encrypted license: ${encryptedLicense}`);
        let decryptedLicense;
        try{
          decryptedLicense = this.cryptographyService.decryptLicenseAsymmetric(privateKey, encryptedLicense);
          // DONE : Decrypt the case, already contained in the message. #Later substitute with html injected
          return decryptedLicense;
        }catch (e) {
          this.hasPermissions = false;
          return null;
          // tslint:disable-next-line:max-line-length
          // environment.isExtensionBuild ? this.alertChromeTab('Error: Private Key Incorrect and/or format.') : alert('Error: Private Key Incorrect and/or format.');
          // this.authenticationService.logout();
        }
      },
      error => {
        console.log(error);
        this.openSnackBar(error.error.error.message, 'Close', 'error-snackbar');
        return null;
        // environment.isExtensionBuild ? this.alertChromeTab(error.error.error.message) : alert(error.error.error.message);
      }
    );
  }

  // FIXME : DELETE!
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
            // FIXME: CHANGE FROM data.spCase to offline DOM and get the case values from there
            /*const decryptedCase = this.decryptCaseFields(decryptedLicense, data.spCase);*/
            /*console.log('Decrypted Case', decryptedCase);
            this.decryptedData = decryptedCase;*/
            this.decryptedDataAvailable = true;
            this.domManipulationService.injectValues(this.injectionDecryptedData);
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


  decryptCaseFromLicense(symmetricKey: string, spCase: any): any{

    // TODO: Decrypt all of the fields found in the caseEncrypted, decrypt and return it!
    // tslint:disable-next-line:prefer-const
    let decryptedCaseWithSensitiveFields = {};
    const decryptedCaseNamed = {};
    // Decrypting
    environment.sensitiveData.forEach(sensitiveField => {
      const sensitiveFieldArray = sensitiveField.split(',');
      console.log('subSensitiveField', sensitiveFieldArray);
      // If there is a document we have address,phoneNumber
      if (sensitiveFieldArray.length === 1) {
        // If the beginning of the value is equal to /ENC/ we decrypt the field
        if (spCase[sensitiveField] != null) {
          // tslint:disable-next-line:triple-equals
          if (spCase[sensitiveField].substring(0, 5) == '/ENC/') {
            const sensitiveFieldValueSplit = spCase[sensitiveFieldArray[0]].split('/');
            const offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
            const encryptedFieldValue = spCase[sensitiveFieldArray[0]].substring(offsetEncryptedFieldValue);
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

        if (spCase[sensitiveFieldArray[0]] != null) {
          spCase[sensitiveFieldArray[0]].forEach((sensitiveDocument: any, index: number) => {
            if (sensitiveDocument.type.toString() !== 'HASHID') {
              const sensitiveDocumentValueSplitted = sensitiveDocument[sensitiveFieldArray[1]].split('/');
              const offsetEncryptedFieldValue = sensitiveDocumentValueSplitted[1].length + sensitiveDocumentValueSplitted[2].length + 3;
              const encryptedFieldValue = sensitiveDocument[sensitiveFieldArray[1]].substring(offsetEncryptedFieldValue, );
              if (sensitiveDocumentValueSplitted[1] === 'ENC') { // if is encrypted
                // Decrypt Field
                const decryptedField: string = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
                // Store the decrypted field as a object with field Type
                decryptedCaseWithSensitiveFields[`${sensitiveFieldArray[0]}[${index}][${sensitiveFieldArray[1]}]`] = decryptedField;
                decryptedCaseNamed[sensitiveFieldArray[1]] = decryptedField;
                // spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
                /*if (subSensitiveField[0] === 'documents') {
                  const documentTypeSplit = spCaseSubObject.type.split('_');
                  const documentType: string = this.properFormatString(documentTypeSplit);
                  decryptedCaseWithSensitiveFields[`documents[${index}][number]`] = decryptedField;
                  decryptedCaseNamed[documentType] = decryptedField;
                } else {*/
                /*}*/
              }
              // Else no Decryption Required
            }
          });
        }
      }
    });
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      console.log('tabs', tabs);
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log(${decryptedCaseWithSensitiveFields});` }
      );
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log(${decryptedCaseNamed});` }
      );
    } );
    this.injectionDecryptedData = decryptedCaseWithSensitiveFields;
    return decryptedCaseNamed;
  }
  properFormatString(textToFormat: Array<string>): string {
    const textFormatted = '';
    /* let text1 = textToFormat.splice(6, textToFormat.length - 1).join(''); */
    const textArr1 = textToFormat.splice(6, textToFormat.length - 1);
    return textArr1.join(' ');
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

  // Notifiers
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
}
