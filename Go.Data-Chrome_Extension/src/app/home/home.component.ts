/* tslint:disable:no-trailing-whitespace */
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthenticationService} from 'src/services/authentication.service';
import {CaseService} from 'src/services/case.service';
import {environment} from '../../environments/environment';

const forge = require('node-forge');
const pki = forge.pki;
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
    this.userActive = userData != null;
  }
  copyToClipboard() {

  }
  decryptCase() {
    if (this.fdecryptForm.caseId.value !== '' ) {

      const email = this.authenticationService.currentUserValue.email;
      // tslint:disable-next-line:max-line-length
      this.caseService.getLicense(email, this.fdecryptForm.caseId.value, this.authenticationService.currentUserValue.privateKey).subscribe(
        data => {
          // FROM LICENSE GET THE SYMMETRIC Key
          console.log(data);
          const license = data.keyUsed;
          console.log(`license:${license}`);
          const symmetricKey = this.decryptKeyRSA(this.authenticationService.currentUserValue.privateKey, license);
          // TODO : Decrypt the case, already contained in the message. #Later substitute with html injected
          const decryptedCase = this.decryptCaseFields(symmetricKey, data.spCase);
          console.log('Decrypted Case', decryptedCase);
          this.decryptedData = decryptedCase;
          this.injectValues(decryptedCase);
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
  getUrlFromTab(){
    // @ts-ignore
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `Tab Url: "${url}";` }
      );
      // use `url` here inside the callback because it's asynchronous!
    });
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
            const decryptedField: string = this.decryptSymmetric(encryptedFieldValue, symmetricKey);
            // spCase[sensitiveField] = decryptedField
            decryptedCaseWithSensitiveFields[sensitiveField] = decryptedField;
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
                  const decryptedField: string = this.decryptSymmetric(encryptedFieldValue, symmetricKey);
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
    /*return this.decryptSymmetric('MuqZ1LpKxGpll3uESZqNsQ==:ddleWxctK46u', symmetricKey);*/
  }
  decryptSymmetric(encryptData: string, ENCRYPTION_KEY: string): string{
    // Get IV + encryptedText from encryptData
    // @ts-ignore
    const encryptDataArray = encryptData.split(':');
    console.log('encryptDataArray ', encryptDataArray);
    /*const iv = Buffer.from(textParts[0], 'base64');
    console.log('iv', iv);*/
    const ivBase64 = encryptDataArray.splice(0, 1).toString();
    const encryptedBase64 = encryptDataArray.join(':');
    const keyBase64 = ENCRYPTION_KEY;
    console.log('keyBase64 ', keyBase64);
    console.log('ivBase64 ', ivBase64);
    console.log('encryptedBase64 ', encryptedBase64);
    /*// BASE64 --> Buffer --> Hex(For Crypto)
    const keyBuffer = Buffer.from(keyBase64, 'base64');
    const keyHex = keyBuffer.toString('hex');
    console.log('keyBuffer:', keyBuffer, 'and keyHex:', keyHex);
    const ivBuffer = Buffer.from(ivBase64, 'base64');
    const ivHex = ivBuffer.toString('hex');
    console.log('ivBuffer:', ivBuffer, 'and ivHex:', ivHex);
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
    const encryptedHex = encryptedBuffer.toString('hex');
    console.log('encryptedBuffer:', encryptedBuffer, 'and encryptedHex:', encryptedHex);
    // CRYPTO-JS
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const cipherText = CryptoJS.enc.Hex.parse(encryptedHex);
    console.log('keyCrypto:', key, 'and ivCrypto:', iv);*/
    /*const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
      iv,
      mode: CryptoJS.mode.CTR,
      format: CryptoJS.format.Hex
    }).toString(CryptoJS.enc.Utf8);
    console.log('decrypted', decrypted);
    // CRYPTO-JS Open Stream
    const aesDecryptor = CryptoJS.algo.AES.createDecryptor(key, { iv: iv });
    const plaintextPart = aesDecryptor.process(cipherText);
    const plaintextPart5 = aesDecryptor.finalize();
    console.log('plainText', plaintextPart);*/
    // Node-Forge
    // tslint:disable-next-line:prefer-const


    /*const keyBinaryData = new Blob([keyBufferArrByte]);
    console.log(keyBinaryData);
    const ivBinaryData = new Blob([ivBufferArrByte]);
    console.log(ivBinaryData);*/
    return this.forgeDecryption(keyBase64, ivBase64, encryptedBase64);
  }
  forgeDecryption(keyBase64, ivBase64, encryptedBase64): string{
    const keyByte = forge.util.decode64(keyBase64);
    const ivByte = forge.util.decode64(ivBase64);
    const ciphertextByte = forge.util.decode64(encryptedBase64);
    const encrypted = forge.util.createBuffer(ciphertextByte);
    // generate a random key and IV
    // Note: a key size of 16 bytes will use AES-128, 24 => AES-192, 32 => AES-256
    const key =  keyByte;
    const iv =  ivByte;
    console.log('keyByte', keyByte);
    console.log('ivByte', ivByte);
    /*const key = forge.random.getBytesSync(32);
    const iv =  forge.random.getBytesSync(16);*/
    console.log('forgekey', key);
    console.log('forgeiv', iv);
    /* alternatively, generate a password-based 16-byte key
    var salt = forge.random.getBytesSync(128);
    var key = forge.pkcs5.pbkdf2('password', salt, numIterations, 16);
    */
    /*const plainText = 'plaintext';
    // encrypt some bytes using CBC mode
    // (other modes include: ECB, CFB, OFB, CTR, and GCM)
    // Note: CBC and ECB modes use PKCS#7 padding as default
    const cipher = forge.cipher.createCipher('AES-CTR', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(plainText));
    cipher.finish();
    const encrypted = cipher.output;
    console.log('forgeEncrypted', encrypted);
    // outputs encrypted hex
    console.log('forgeEncryptedHex', encrypted.toHex());*/

    // decrypt some bytes using CBC mode
    // (other modes include: CFB, OFB, CTR, and GCM)
    const decipher = forge.cipher.createDecipher('AES-CTR', key);
    decipher.start({iv});
    decipher.update(encrypted);
    const result = decipher.finish(); // check 'result' for true/false
    // outputs decrypted hex
    const plainHex = decipher.output.toHex();
    console.log('plainHex', plainHex);
    const plainBuffer = Buffer.from(plainHex, 'hex');
    console.log('plainBuffer', plainBuffer);
    const plainUtf8 = plainBuffer.toString();
    console.log('plainUtf8', plainUtf8);
    return plainUtf8;
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
