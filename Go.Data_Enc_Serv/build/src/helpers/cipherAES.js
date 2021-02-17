"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
/**
 * Encrypts the data, given Key in string &
 * Data in string: (utf-8,base64,etc...)
 */
function encryptSymmetric(text, ENCRYPTION_KEY, iv) {
    const algorithm = 'aes-256-ctr';
    //let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto_1.default.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('base64') + ':' + encrypted.toString('base64');
}
/**
 * Decrypts the data, given symmetric key in string(format:any) &
 * encryptedText in string(hex)
 */
function decryptSymmetric(encryptText, ENCRYPTION_KEY) {
    const algorithm = 'aes-256-ctr';
    let textParts = encryptText.split(':');
    // @ts-ignore
    let iv = Buffer.from(textParts.shift(), 'base64');
    let encryptedText = Buffer.from(textParts.join(':'), 'base64');
    let decipher = crypto_1.default.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
exports.default = {
    encryptSymmetric,
    decryptSymmetric
};
