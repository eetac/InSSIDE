import crypto from "crypto";

/**
 * Encrypts the data, given publicKey in string(format:pem) &
 * Data in string: (utf-8,base64,etc...)
 */
function encryptKeyRSA(publicKey: string, data: string):string{
    return crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        // We convert the data string to a buffer using `Buffer.from`
        Buffer.from(data)
    ).toString('base64');
}
/**
 * Decrypts the data, given privateKey in string(format:pem) &
 * encryptedData in string(base64)
 */
function  decryptKeyRSA(privateKey: string, encryptedData: string):string{
    return crypto.privateDecrypt(
        {
            key: privateKey,
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        new Buffer(encryptedData, 'base64')
    ).toString();
}
export default {
    encryptKeyRSA,
    decryptKeyRSA
}