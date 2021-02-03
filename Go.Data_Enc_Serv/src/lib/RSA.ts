//RSA Class
import * as bigintCryptoUtils from 'bigint-crypto-utils' //LIBRARY TO CREATE RSA
import * as bigintConversion from 'bigint-conversion'
import {PublicKey} from './PublicKey';
import {PrivateKey} from './PrivateKey';

export class RSA{

    //Here the Pub and Priv Keys are generated
    static async generateKeys(){  //Ex 2048
         console.log("Inside GenerateKeys")
    //    // let bitL = bigintCryptoUtils.bitLength(bitlength) //if we want a key of a certain bitlength we need n equal to this
        let p = await bigintCryptoUtils.prime(1025);//1025

        let q = await bigintCryptoUtils.prime(1024);//1024

        let n = p * q; //Now we have to check if this public mod is bigger than the bitLength
        // 1025 bits number * 1024 bits number = 2048 bits number
        while(bigintCryptoUtils.bitLength(n) != 2048){
            //while n is different of bitLength we need to generate new q and try again
            p = await bigintCryptoUtils.prime(1025)
            q = await bigintCryptoUtils.prime(1024);
            n= p * q
        }
        //Now we have p,q,n
        //Euler
        let eulerFunc = (p-1n) * (q-1n);
        let e = 65537n;//2^16 +1
        //Check gcd e and fi = 1
        let d = bigintCryptoUtils.modPow(e,-1,eulerFunc);
        let pubKey = new PublicKey(e,n);
        let privKey = new PrivateKey(d,n)

        return {pubKey,privKey}


    }

}


