import crypto from "crypto";

/**
 * Encrypts the data, given Key in string &
 * Data in string: (utf-8,base64,etc...)
 */
function encryptSymmetric(text:string, ENCRYPTION_KEY:string, iv:Buffer) {
    const algorithm = 'aes-256-ctr';
    //let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
/**
 * Decrypts the data, given symmetric key in string(format:any) &
 * encryptedText in string(hex)
 */
function  decryptSymmetric(encryptText:string, ENCRYPTION_KEY:string) {
    const algorithm = 'aes-256-ctr';
    let textParts = encryptText.split(':');
    // @ts-ignore
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
export default {
    encryptSymmetric,
    decryptSymmetric
}