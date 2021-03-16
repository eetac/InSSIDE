import {Injectable} from '@angular/core';

const forge = require('node-forge');
const pki = forge.pki;
const Buffer = require('buffer/').Buffer;
@Injectable({
  providedIn: 'root'
})
export class CryptographyService {

 constructor() { }
  /**
   * Decrypts an encrypted string in Base6, Using Node-Forge Library. The
   * Encryption must be of type symmetric AES in Counter Mode with block size of 256.
   * Thus the encrypted string must come with a iv also in Base64. Do be able to decrypt
   * the must also be given in Base64.
   * @returns The decrypted string in UTF-8 from encrypted string, IV(Base 64) and Key(Base64).
   *
   * @krunal
   * @param keyBase64 - string Base64
   * @param ivBase64 - string Base64
   * @param encryptedBase64 - string Base64
   */
  private static forgeDecryption(keyBase64, ivBase64, encryptedBase64): string{
    const key = forge.util.decode64(keyBase64);
    const iv = forge.util.decode64(ivBase64);
    const ciphertextByte = forge.util.decode64(encryptedBase64);
    const encryptedBuffer = forge.util.createBuffer(ciphertextByte);
    // generate a random key and IV
    // Note: a key size of 16 bytes will use AES-128, 24 => AES-192, 32 => AES-256
    /*const key =  keyByte;
    const iv =  ivByte;*/
    /*console.log('keyByte', keyByte);
    console.log('ivByte', ivByte);
    const key = forge.random.getBytesSync(32);
    const iv =  forge.random.getBytesSync(16);
    console.log('forgekey', key);
    console.log('forgeiv', iv);*/
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
    decipher.update(encryptedBuffer);
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
  /**
   * Decrypts the license of a case. The Encryption scheme used is
   * RSA with OAEP padding of 4 bytes with a verification hash of
   * SHA256.
   *
   * @returns The decrypted license from encryptedLicense and private key.
   *
   * @krunal
   * @param privateKeyPem - User private key, given when registered (Base64)
   * @param encryptedlicense - Encrypted license of the case (Base64)
   */
  decryptLicenseAsymmetric(privateKeyPem: string, encryptedlicense: string): string{
    const privateKey = pki.privateKeyFromPem(privateKeyPem);
    console.log(`Private Key Pem Format: `, privateKeyPem);
    console.log('Private Key: ', privateKey);
    // decrypt data with a private key using RSAES-OAEP padding/SHA-256 verification hash
    // @ts-ignore
    const decryptedLicense = privateKey.decrypt(new Buffer(encryptedlicense, 'base64'), 'RSA-OAEP', {
      md: forge.md.sha256.create()
    });
    console.log('Symmetric License Key', decryptedLicense);
    return decryptedLicense;
  }
  /**
   * Decrypts an encrypted string in Base64, The Encryption must be of type symmetric AES
   * in Counter Mode with block size of 256. The license/key must also be provided
   * which was used to encrypt the data.
   * @returns The decrypted string in UTF-8 from encrypted string, IV(Base 64) and Key(Base64).
   *
   * @krunal
   * @param license - License or symmetric key used for encryption in Base64
   * @param encryptedData - Encrypted data in string Base64 format /ENC/Institute/key:iv
   */
  decryptPropertySymmetric(license: string, encryptedData: string){
    // Get IV + encryptedText from encryptData
    // @ts-ignore
    const encryptedDataArray = encryptedData.split(':');
    console.log('encryptDataArray ', encryptedDataArray);
    /*const iv = Buffer.from(textParts[0], 'base64');
    console.log('iv', iv);*/
    const ivBase64 = encryptedDataArray.splice(0, 1).toString();
    const encryptedBase64 = encryptedDataArray.join(':');
    /*console.log('keyBase64 ', keyBase64);
    console.log('ivBase64 ', ivBase64);
    console.log('encryptedBase64 ', encryptedBase64);*/
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
    return CryptographyService.forgeDecryption(license, ivBase64, encryptedBase64);
  }
}
