import crypto from "crypto";

/**
 * Encrypts the data, given Key in string &
 * Data in string: (utf-8,base64,etc...)
 */
function encryptSymmetric(text:string, ENCRYPTION_KEY:string, iv:Buffer) {
    const algorithm = 'aes-256-ctr';
    //let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('base64') + ':' + encrypted.toString('base64');
}
/**
 * Decrypts the data, given symmetric key in string(format:any) &
 * encryptedText in string(hex)
 */
function  decryptSymmetric(encryptText:string, ENCRYPTION_KEY:string) {
    const algorithm = 'aes-256-ctr';
    let textParts = encryptText.split(':');
    // @ts-ignore
    let iv = Buffer.from(textParts.shift(), 'base64');
    let encryptedText = Buffer.from(textParts.join(':'), 'base64');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
export default {
    encryptSymmetric,
    decryptSymmetric
}