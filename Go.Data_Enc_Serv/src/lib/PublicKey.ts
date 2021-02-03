//Public Key Class for RSA (Encrypt and Verify)
import * as bigintCryptoUtils from 'bigint-crypto-utils' //LIBRARY TO CREATE RSA
import * as bigintConversion from 'bigint-conversion'


export class PublicKey {
    e: any; //Public Exponent
    n: any; //Public modulus
  
    constructor(e:any,n:any) {
      this.e = e;
      this.n = n;
    }
  
    encrypt(message:any) {

        
        let m = bigintConversion.textToBigint(message); //Convert text to big int for operate
        //console.log("BIGINT BUFFER",m)
        let cipherBigInt = bigintCryptoUtils.modPow(m,this.e,this.n)
        //console.log("CIPHERTEXT BIGINT",cipherBigInt)
        let c = bigintConversion.bigintToHex(cipherBigInt)
        return c; //Always hexa to be sended in the JSON

    }
    verify(sign:string) {

      let s = bigintConversion.hexToBigint(sign)
      //console.log("CIPHERTEXT BIGINT DECRRYPT",c)
      let verify = bigintCryptoUtils.modPow(s,this.e,this.n)
      //console.log("MESSAGE  BIGINT DECRYPT",message)
      return bigintConversion.bigintToText(verify);

    }
  }
  
  