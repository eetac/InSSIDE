/* tslint:disable:no-trailing-whitespace */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/services/authentication.service';
import { CaseService } from 'src/services/case.service';

const forge = require('node-forge');
const pki = forge.pki;
const aesjs = require('aes-js');
const CryptoJS = require('crypto-js');
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
        const decryptedCase = this.decryptCaseFields(symmetricKey, data.spCase);
        console.log('Decrypted Case', decryptedCase);
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
  decryptCaseFields(symmetricKey: string, caseEncrypted: any): any{

    // TODO: Decrypt all of the fields found in the caseEncrypted, decrypt and return it!
    const fieldDecrypted = this.decryptSymmetric('MuqZ1LpKxGpll3uESZqNsQ==:ddleWxctK46u', symmetricKey);
    return fieldDecrypted;
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
    // BASE64 --> Buffer --> Hex(For Crypto)
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
    console.log('keyCrypto:', key, 'and ivCrypto:', iv);
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
