import { Request, Response, json, NextFunction } from 'express';
import { RSA } from '../lib/RSA';
import * as bigintCryptoUtils from 'bigint-crypto-utils'
import * as CryptoJS from 'crypto-js'
import User from '../models/user';//We send a message to the client
import { toJson } from 'typedjson';
import { EncryptCases } from '../lib/EncryptCases';
import { ConfigurationData } from '../lib/config';
import GoDataLicenses from '../models/godataLicenses';
import { bigintToText, textToBigint } from 'bigint-conversion';

async function login(req: Request, res: Response, next: NextFunction) {

    console.log('Log in -> username: ' + req.body.username + ' ' + req.body.password)
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ 'msg': 'You need to send username and password' });
    }
    let tryUser = new User(await User.findOne({ username: req.body.username }));
    let password = CryptoJS.SHA256(req.body.password).toString()
    if (password == tryUser.get('password')) {
        res.status(200).send();
        //     token: jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: 60 }),
        //     'message': 'probando'
    }
    else {
        return res.status(400).send({ message: 'The username and password don\'t match.' });
    }


}

async function register(req: Request, res: Response) {

    const username = req.body.username;
    console.log(req.body);
    let existUser = await User.findOne({ username: username });
    if (existUser) {
        res.status(403).json({ message: "Already exist a user w/ this username" });
    }
    else {
        let managerUser = new User(await User.findOne({ username: "admin" })); //We need the managerUser to encrypt the private key of other users
        //When we want to add new user we need to generate RSA keys
        let keys = await RSA.generateKeys();
        console.log('Adding User');


        //We need to has the password 
        let password = CryptoJS.SHA256(req.body.password).toString();

        //Parsing everything
        let pubKey = {
            publicexp: keys.pubKey.e,
            publicmod: keys.pubKey.n
        }
        let privKey = {
            privateexp: keys.privKey.d,
            publicmod: keys.privKey.n
        }

        let { username, contactInfo } = req.body;

        let openUser = new User({ username, contactInfo, password, pubKey, privKey }); //The user that we send to the client without encrypting the privKey
        console.log('Sin cifrar clave privada---> ' + privKey.privateexp)
        privKey.privateexp = bigintCryptoUtils.modPow(privKey.privateexp, managerUser.get('pubKey.publicexp'), managerUser.get('pubKey.publicmod'));//encrypt w/ pubkey of System
        //The user that we save in the DB w/ the privKey encrypted
        console.log(username)
        let newUser = new User({ username, contactInfo, password, pubKey, privKey });

        //let priv = bigintCryptoUtils.modPow(privKey.privateexp,managerUser.get('privKey.privateexp'),managerUser.get('pubKey.publicmod'));//decrypt w/ pubkey of System
        //console.log("ENCRYPTADA Y DESENCRYPTADA SON IGUALES__>"+priv)

        newUser.save().then((data) => {
            console.log('User added successfully');
            res.status(201).json(openUser);
        }).catch((err) => {
            console.log(err)
            res.status(500).json({ message: err });
        })
    }

}

async function getKeyOfCase(req: Request, res: Response) {
    //Hospital ask for the decryption key of a case and DRM return the key encrypted with the pubKey for security reasons
    const config: ConfigurationData = new ConfigurationData();
    let hashCase = req.body.hashCase;//req.params.hashCase;
    let username = req.body.username; //We get this value from the token

    //In case there is a problem finding the hash case
    try {
        let goDataId = new GoDataLicenses(await GoDataLicenses.findOne({ hash: hashCase, creatorEmail:username})).toJSON();
        let i = 0;
        while (goDataId.keys[i].hospitalName != username) {
            i = i + 1;
        }
        if (goDataId.keys[i].hospitalName == username) {
            // let managerUser = new User(await User.findOne({ username: "admin" }));
            // let useruser = new User(await User.findOne({ username: username }));
            // let privateKeyOfUSer: bigint = bigintCryptoUtils.modPow(useruser.get('privKey.privateexp'), managerUser.get('privKey.privateexp'), managerUser.get('pubKey.publicmod'))
            // let symmetricKey: bigint = bigintCryptoUtils.modPow(goDataId.keys[i].usedKey, privateKeyOfUSer, useruser.get('pubKey.publicmod'))
            // console.log(bigintToText(symmetricKey)) //Works --> Symmetric Key obtained decrypting first the privatekey of user
            // that has been encrypted with RSA of admin and the decrypting with the privateKey of User

            //Tenemos que devolver el caso encryptado para reducir procesos en la extensión
            const encrypt: EncryptCases = new EncryptCases;
            let cases = await encrypt.getCases()
            for (let j = 0; j < cases.length; j++) {
                let positionHash = 0; // To then return if the hash is the correct one
                while (cases[j]["documents"][positionHash]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_OTHER") {
                    positionHash = positionHash + 1;
                }
                //Case 1 --> The case to decrypt is the one creat
                let toBeSplit = cases[j]["firstName"] //Check for email and encrypted field comparision
                let splitted = toBeSplit.split("/");
                console.log(splitted[2])
                if ((cases[j]["documents"][positionHash]["number"] == hashCase) &&(splitted[2] == username)) { //Two conditions to avoid problems with double identities
                    //We send the keys to decrypt 
                    //TRY DECRYPT
                    //console.log(cases[j])
                  return res.status(200).send({ "keyUsed": goDataId.keys[i].usedKey, "spCase": cases[j]  ,"isTheCreator": "y"});
                    break;
                }
                else if((cases[j]["documents"][positionHash]["number"] == hashCase) &&(splitted[2] != username)){
                    throw new Error('Go and check if you are inside other permissions'); 
                    //This is for cases where we have done the merge and the data is not our data but we have permissions
                }    
            }
            return res.status(404).send();
        }
        else {
            res.status(404).send();
        }
    }
    catch (error) {
        //If is not the creator we need to check for the hash Case if has permission from other hospital
        let goDataId1 = new GoDataLicenses(await GoDataLicenses.findOne({hash: hashCase, "keys.hospitalName":username })).toJSON();
        console.log("CASO EN EL QUE NOS HAN DADO PERMISO-->"+goDataId1.hash)
        let i = 0;
        while (goDataId1.keys[i].hospitalName != username) {
            i = i + 1;
        }
        if (goDataId1.keys[i].hospitalName == username) {
            //Tenemos que devolver el caso encryptado para reducir procesos en la extensión
            const encrypt: EncryptCases = new EncryptCases;
            let cases = await encrypt.getCases()
            for (let j = 0; j < cases.length; j++) {
                let positionHash = 0; // To then return if the hash is the correct one
                while (cases[j]["documents"][positionHash]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_OTHER") {
                    positionHash = positionHash + 1;
                }
                let toBeSplit = cases[j]["firstName"] //Check for email and encrypted field comparision
                let splitted = toBeSplit.split("/");
                console.log(splitted[2])
                if ((cases[j]["documents"][positionHash]["number"] == hashCase) &&(splitted[2] == goDataId1.creatorEmail)) { //Two conditions to avoid problems with double identities in this case the email is the email of the creator
                    //We send the keys to decrypt 
                    //TRY DECRYPT
                    //console.log(cases[j])
                    res.status(200).send({ "keyUsed": goDataId1.keys[i].usedKey, "spCase": cases[j] ,isTheCreator: "n",emailCreator : goDataId1.creatorEmail}); //TO THEN DECRYPT IN THE CORRECT WAY WE NEED TO KNOW IF ITS IS THE CREATOR OR NOY
                    break;
                }
            }
            res.status(404).send();
        }
        else {
            res.status(404).send();
        }
        res.status(500).send()

    }

}

async function dataKeyTransfer(req:Request, res: Response){
    console.log("Arrived Transfer Solicited")
    //Transferring the Key from one hospital no another
    let hashCase = req.body.hashCase;
    let username = req.body.username; 
    let usernameToTransfer = req.body.usernameToTranfer;
    let rootUser = new User(await User.findOne({ username: "admin"})).toJSON(); //Needed to obtain the private key --> It can be changed to send directly form extension
    let targetUser =  new User(await User.findOne({ username: usernameToTransfer})).toJSON();
    let identityToTransfer = new GoDataLicenses(await GoDataLicenses.findOne({ hash: hashCase , creatorEmail: username })) //To obtain the password
    let JsonLicenseToTransfer = identityToTransfer.toJSON()
    console.log(JsonLicenseToTransfer)
    //Decrypt Sym Key
    let privateKeyOfUser: bigint = bigintCryptoUtils.modPow(JsonLicenseToTransfer.keys[0].usedKey, rootUser.privKey.privateexp, rootUser.privKey.publicmod)
    let newEntryOfTransfer = {
        hospitalName: usernameToTransfer ,
        usedKey: bigintCryptoUtils.modPow(privateKeyOfUser, targetUser.pubKey.publicexp, targetUser.pubKey.publicmod) ,
    }
    JsonLicenseToTransfer["keys"].push(newEntryOfTransfer)
    //We overwrite with the new keys
    identityToTransfer.overwrite(JsonLicenseToTransfer);
    //We save the data 
    await identityToTransfer.save().then((data) => {
        console.log('Transferred Info successfully');
        res.status(200).send();
    }).catch((err) => {
        console.log(err)
        res.status(500).json({ message: err });
    })
}
export default { login, register, getKeyOfCase, dataKeyTransfer }