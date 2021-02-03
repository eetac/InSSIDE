//Private Key Class for RSA (Decrypt and Sign)
import * as bigintCryptoUtils from 'bigint-crypto-utils' //LIBRARY TO CREATE RSA
import * as bigintConversion from 'bigint-conversion'


export class PrivateKey {
    d: any; //Private Exponent
    n: any; //Public modulus
  
    constructor(d:any,n:any) {
      this.d = d;
      this.n = n;
    }
  
    decrypt(ciphertext:any) {

        let c = bigintConversion.hexToBigint(ciphertext)
        //console.log("CIPHERTEXT BIGINT DECRYPT",c)
        let message = bigintCryptoUtils.modPow(c,this.d,this.n);
        //console.log("MESSAGE  BIGINT DECRYPT",message)
        return bigintConversion.bigintToText(message);
      

    }
    sign(message:string) {
      //Everybody will be able to check the content --> Used to verify Certificates
        var buf = bigintConversion.textToBuf(message)
        let m = bigintConversion.bufToBigint(buf); //Convert text to big int for operate
        let sign = bigintCryptoUtils.modPow(m,this.d,this.n)
        let s = bigintConversion.bigintToHex(sign)
        return s; //Always hexa to be sended in the JSON

    }
  }
  