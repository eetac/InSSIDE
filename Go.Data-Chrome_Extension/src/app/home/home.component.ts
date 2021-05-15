import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'src/services/authentication.service';
import {CaseService} from 'src/services/case.service';
import {DomManipulationService} from 'src/services/dom-manipulation.service';
import {CryptographyService} from 'src/services/cryptography.service';
import {environment} from '../../environments/environment';
import {MatSnackBar} from '@angular/material/snack-bar';

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
    this.chromeDecryptAndInject();
  }

  ngOnInit(): void {
    this.userStatus();
    this.decryptedDataAvailable = false;
    this.decryptForm = this.formBuilder.group({
      hashId: ['', []]
    });
    this.transferForm = this.formBuilder.group({
      hospitalToTransfer: ['', [Validators.required]]
    });
  }

  get fdecryptForm() { return this.decryptForm.controls; }
  get ftransferForm() { return this.transferForm.controls; }

  userStatus() {

    const userData = this.authenticationService.currentUserValue;
    this.userActive = userData != null;
  }

  decryptCase(){
    if (this.fdecryptForm.hashId.value !== '' ) {
      if (this.injectionDecryptedData || this.decryptedData ){
        this.reload();
      }else{
        this.runDecryption(this.fdecryptForm.hashId.value);
      }
    }else{
      this.alertChromeTab('hashId Required');
    }
  }
  chromeDecryptAndInject(){
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      console.log('tabs', tabs);
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log("URL: ", "${url}");` }
      );
      // Separate the string and obtain the hashId
      const UrlSplit = url.split('/');
      if (UrlSplit.length === 6){
        if (UrlSplit[5] === 'view' || UrlSplit[5] === 'modify'){
          const hashIdUrl = UrlSplit[4].toString();
          this.domManipulationService.getHashIdFromDOM().then((hashIds) => {
             // Hash Id
              // @ts-ignore
              chrome.runtime.sendMessage( {HomeHashIdResult: hashIds}, (_: any) => {});
              // @ts-ignore
              chrome.runtime.sendMessage( hashIds, (_: any) => {});
              /**documents: Array(2)
               * 0: {number: "9cbf8a4dcb8e30682b927f352d6559a0", type: "HASHID"}
               * 1: {number: "9cbf8a4dcb8e30682b927f352d6559a0", type: "HASHID"}
               */
              if (hashIds){
                  if (!Array.isArray(hashIds) || !hashIds.length  ) {
                      this.alertChromeTab('Error: No Hash Id found');
                  }else{
                      if (hashIds.every( (val, i, arr) => val.number === arr[0].number))
                      {
                          this.fdecryptForm.hashId.setValue(hashIds[0].number);
                          // CHANGED FROM GET CASE FROM SERVER TO OFFLINE DOM RETRIEVAL
                          this.runDecryption(hashIds[0].number);
                      }else{
                          this.alertChromeTab('Error: Different HashIds for same case');
                      }
                  }
              }else{
                  this.alertChromeTab('Error: Hash Id Nill on current page');
              }
          }).catch((err) => {
              this.alertChromeTab('Error: Not GoData Patient Case Page');
          });
        }else{
          this.alertChromeTab('Error: Not GoData Patient Case Page');
        }
      }else{
        this.alertChromeTab('Error: Not GoData Patient Case Page');
      }
    } );
  }
  /**
   * Runs the decryption code, which include the retrieval of encrypted value from webpage,
   * retrieval of license and the decryption of both license and case. And at last presenting them both in the extension and by
   * injecting it onto the webpage.
   * @returns Returns void
   * @krunal
   * @param hashId - string
   */
  runDecryption( hashId: string) {
    this.domManipulationService.getCaseFromDOM().then((caseData) => {
      // @ts-ignore
      // tslint:disable-next-line:only-arrow-functions
      chrome.runtime.sendMessage({PromiseResultGetCaseFromDOM: caseData}, function(_: any) {});
      if (caseData) {
        // CaseData retrieved --> Now get the license than decrypt and in last Inject to the page
        // Step1. Get License and Decrypt the license to obtain symmetric key
        this.getLicenseAndObtainSymmetricKey(hashId).then((decryptedLicense) => {
            // @ts-ignore
            chrome.runtime.sendMessage( {DecryptedLicense: decryptedLicense}, (_: any) => {});
            // Step3. Decrypt the case with the symmetric key
            try {
            const decryptedCase = this.decryptCaseFromLicense(decryptedLicense, caseData);
            if (decryptedCase){
              if (Object.keys(decryptedCase).length > 0){
                // @ts-ignore
                // tslint:disable-next-line:only-arrow-functions
                chrome.runtime.sendMessage({decryptedCase}, function(_: any) {});
                this.decryptedData = decryptedCase;
                this.reload();
              }
            }
          } catch (err) {
            // @ts-ignore
            chrome.runtime.sendMessage({runDecryptionError: err.message}, (_: any) => {});
            this.openSnackBar('Error: License/Case are bad.', 'Close', 'error-snackbar');
          }
          // Step4. Inject the decrypted data to the webpage
            this.domManipulationService.injectValues(this.injectionDecryptedData);
        }).catch((_) => {});
      } else{
        this.alertChromeTab('Error: Could not read the page contents');
      }
    });
  }

  /**
   * Gets the license from the DRM server and returns the symmetric key by decrypting the
   * license with the private key.
   * @returns Returns the decrypted key else null on error!
   * @krunal
   * @param hashId - string
   */
  getLicenseAndObtainSymmetricKey(hashId: string): Promise<any>{
    return new Promise(async (resolve, reject ) => {
      const hospital = this.authenticationService.currentUserValue.hospital;
      const privateKey = this.authenticationService.currentUserValue.privateKey;
      // tslint:disable-next-line:max-line-length
      this.caseService.getLicense(hospital, hashId).subscribe(
        data => {
          // FROM LICENSE GET THE SYMMETRIC Key & Decrypt the case and inject+Show
          // @ts-ignore
          // tslint:disable-next-line:only-arrow-functions
          chrome.runtime.sendMessage({caseService : data}, function(_: any) {});
          const encryptedLicense = data.license;
          console.log(`Encrypted license: ${encryptedLicense}`);
          let decryptedLicense: string;
          try{
            // @ts-ignore
            // tslint:disable-next-line:only-arrow-functions
            chrome.runtime.sendMessage({privateKey}, function(_: any) {});
            decryptedLicense = this.cryptographyService.decryptLicenseAsymmetric(privateKey, encryptedLicense);
            // @ts-ignore
            // tslint:disable-next-line:only-arrow-functions
            /*chrome.runtime.sendMessage({decryptedLicense}, function(_: any) {});*/
            // DONE : Decrypt the case, already contained in the message. #Later substitute with html injected
            return resolve( decryptedLicense);
          }catch (e) {
            this.hasPermissions = false;
            return reject('Error: Private Key Incorrect and/or format.');
          }
        },
        error => {
          this.openSnackBar(error.error.error.message, 'Close', 'error-snackbar');
          return reject(error.error.error.message);
        }
      );
    });
  }

  private reload() {
    setTimeout(() => this.decryptedDataAvailable = false);
    setTimeout(() => this.decryptedDataAvailable = true);
}
  decryptCaseFromLicense(symmetricKey: string, spCase: any): any{

    // TODO: Decrypt all of the fields found in the caseEncrypted, decrypt and return it!
    // tslint:disable-next-line:prefer-const
    let decryptedCaseWithSensitiveFields = {};
    const decryptedCaseNamed = {};
    // Decrypting
    environment.sensitiveData.forEach(sensitiveField => {
      const sensitiveFieldArray = sensitiveField.split(',');
      // If there is a document we have address,phoneNumber
      if (sensitiveFieldArray.length === 1) {
        // If the beginning of the value is equal to /ENC/ we decrypt the field
        if (spCase[sensitiveField]) {
            if ( spCase[sensitiveField].substring(0, 5) === '/ENC/'){
            const sensitiveFieldValueSplit = spCase[sensitiveFieldArray[0]].split('/');
            // TODO: Check if the encrypted field has the same hospital as the license-?
            // FIXME: Choose between hospital or name of the hospital, thus removing
            //        the hospital completely. Updating the registration and login system to use
            //        Name of the hospital, for the account!
            if (sensitiveFieldValueSplit[2].toLowerCase() === this.authenticationService.currentUserValue.hospital.toLowerCase()){
               // '/ENC/Hospital/SensitiveField'
              const offsetEncryptedFieldValue = 0 + 1 + sensitiveFieldValueSplit[1].length + 1 + sensitiveFieldValueSplit[2].length + 1;
              const encryptedFieldValue = spCase[sensitiveFieldArray[0]].substring(offsetEncryptedFieldValue);
              // @ts-ignore
              chrome.runtime.sendMessage( {encryptedFieldValue}, (_: any) => {});
              spCase[sensitiveField] = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
              decryptedCaseNamed[sensitiveField] =  spCase[sensitiveField];
            }else{
              const err = `${sensitiveField} is encrypted with different hospital license, not decrypting this field!`;
              // @ts-ignore
              chrome.runtime.sendMessage( {decryptCaseFromLicenseError: err}, (_: any) => {});
            }


          }
        } else {
          const err = `${sensitiveField} is null, not decrypting this field!`;
          // @ts-ignore
          chrome.runtime.sendMessage( {decryptCaseFromLicenseError: err}, (_: any) => {});
        }
      } else {
        // Has sensitiveField configured in config with internal subfields of the objects stored in a array
        // Documents which contains a list of documents such as nationality, archived_id etc, so
        // need to go over each document and encrypt the number of that document which we want to protect
        // Also applies for addresses, which might contain phone and addresses
        if (spCase[sensitiveFieldArray[0]]) {
          spCase[sensitiveFieldArray[0]].forEach((sensitiveDocument: any, index: number) => {
            if (sensitiveDocument[sensitiveFieldArray[1]].substring(0, 5) === '/ENC/'){
              const sensitiveDocumentValueDisjoint = sensitiveDocument[sensitiveFieldArray[1]].split('/');

              // TODO: Check if the encrypted field has the same hospital as the license-?
              // FIXME: Choose between hospital or name of the hospital, thus removing
              //        the hospital completely. Updating the registration and login system to use
              //        Name of the hospital, for the account!
              if (sensitiveDocumentValueDisjoint[2] === this.authenticationService.currentUserValue.hospital.toLowerCase()){
                const offsetEncryptedFieldValue = sensitiveDocumentValueDisjoint[1].length + sensitiveDocumentValueDisjoint[2].length + 3;
                const encryptedFieldValue = sensitiveDocument[sensitiveFieldArray[1]].substring(offsetEncryptedFieldValue, );
                  // Decrypt Field
                const decryptedField: string = this.cryptographyService.decryptPropertySymmetric(symmetricKey, encryptedFieldValue);
                  // Store the decrypted field as a object with field Type
                spCase[sensitiveFieldArray[0]][index][sensitiveFieldArray[1]] = decryptedField;
                decryptedCaseNamed[`${sensitiveDocument.type}`] = decryptedField;
              }else{
                const err = `${sensitiveFieldArray[1]} is encrypted with different hospital license, not decrypting this field!`;
                // @ts-ignore
                chrome.runtime.sendMessage( {decryptCaseFromLicenseError: err}, (_: any) => {});
              }
            }else {
              const err = `${sensitiveFieldArray[1]} is null, not decrypting this field!`;
              // @ts-ignore
              chrome.runtime.sendMessage( {decryptCaseFromLicenseError: err}, (_: any) => {});
            }
          });
        }
      }
    });
    // @ts-ignore
    // tslint:disable-next-line:only-arrow-functions max-line-length
    chrome.runtime.sendMessage( {decryptedCaseWithSensitiveFields, decryptedCaseNamed }, function(_: any) {});
    this.injectionDecryptedData = spCase;
    return decryptedCaseNamed;
  }

  properFormatString(textToFormat: Array<string>): string {
    const textArr1 = textToFormat.splice(6, textToFormat.length - 1);
    return textArr1.join(' ');
  }

  shareAccessToHospitals(){
    if ((this.fdecryptForm.hashId.value !== '') && (this.ftransferForm.hospitalToTransfer.value !== '')) {

        const hospital = this.authenticationService.currentUserValue.hospital;
        const hashId = this.fdecryptForm.hashId.value;
        const hospitalToTransfer = this.ftransferForm.hospitalToTransfer.value;
        this.caseService.transferLicense(hospital, hashId, hospitalToTransfer).subscribe(
        data => {
          // FROM LICENSE GET THE SYMMETRIC Key & Decrypt the case and inject+Show
          console.log(data);
          this.alertChromeTab('Transfer Successful');
        },
        error => {
          console.log(error);
          this.alertChromeTab(error.error.error.message);
        }
      );
    }
    else {
      this.alertChromeTab('Error: hashId and Destination Hospital Require');
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
    chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs: any) => {
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
