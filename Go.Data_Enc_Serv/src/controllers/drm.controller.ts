import { Request, Response} from 'express';
import goDataHelper from "../helpers/goDataHelper";
import User, {IUser} from '../models/user';//We send a message to the client
import { default as encryptRSA } from '../helpers/cipherRSA';
import GoDataLicenses from "../models/godataLicense";
const Bcrypt = require('bcrypt');
const crypto = require("crypto");
const config = require('../configurations/config');

async function login(req: Request, res: Response) {

    console.log('Log in -> hospital: ' + req.body.hospital + ' ' + req.body.password)
    if (!req.body.hospital || !req.body.password) {
        return res.status(400).json({error: { message:"hospital/Password required" ,status:400}});
    }
    User.findOne({ hospital: req.body.hospital }).then((user)=>{
        if(user!=null){
            if (Bcrypt.compareSync(req.body.password, user.password)) {
                console.log("Login Successful");
                res.status(200).send({ message: 'Login Successful'});
            }
            else {
                console.log("Login Failed, The hospital and password don\'t match.");
                return res.status(400).send({ error: {message:"The hospital and password don\'t match.",status:400}});
            }
        }else{
            console.log("Login Failed, Failed while trying to login, now user found");
            res.status(400).send({ error: { message: 'Login Failed, hospital/Password Incorrect or Not Found!' ,status:400}});
        }
    }).catch((err)=>{
        console.log("Login Failed, Failed while trying to login");
        return res.status(500).send({ error: { message: 'Failed while trying to login' ,status:500}});
    });
}

async function register(req: Request, res: Response) {
    req.body.hospital = req.body.hospital.toLowerCase();
    const hospital = req.body.hospital;
    const goDataPassword = req.body.password;

    console.log(req.body);
    let existUser = await User.findOne({ hospital: hospital });
    if (existUser) {
        res.status(403).json({error: { message: "Already exist a user with this hospital" ,status:403}});
    }
    else {
        //When we want to add new user we need to generate RSA keys
        //We need to hash the password
        const saltRounds = 10;
        let password = Bcrypt.hashSync(goDataPassword,saltRounds);
        // RSA Private and Public Key in PEM format, if we need to export the key as a file ##FUTURE!
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa',
            {   modulusLength: 4096,  // the length of your key in bits
                publicKeyEncoding: {
                    type: 'spki',       // recommended to be 'spki' by the Node.js docs
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',      // recommended to be 'pkcs8' by the Node.js docs
                    format: 'pem',
                    //cipher: 'aes-256-cbc',   // *optional*
                    //passphrase: 'top secret' // *optional*
                }
            });
        let newUser:IUser = new User({
            hospital           :   hospital,
            password        :   password,
            publicKey       :   publicKey,
            privateKey      :   'Not stored'
        });
        console.log(newUser)
        // New user will be sent to the user who just registered, on top of that we need to encrypt the private key itself
        // with the user password, so that even on a db leak, all of the data is protected by hospital key!
        // FUTURE--> For now no encryption, as the hospital should be able to ask for a password change!

        newUser.save().then((data) => {
            console.log('User added successfully');
            newUser.password = "password-hidden";
            newUser.privateKey = privateKey;
            res.status(201).json(newUser);
        }).catch((err) => {
            console.log(err)
            res.status(500).json({error: { message: err ,status:500}});
        })
    }

}

async function getKeyOfCase(req: Request, res: Response) {
    //Hospital ask for the decryption key of a case and DRM return the key encrypted with the pubKey for security reasons
    let hashId = req.body.hashId;//req.params.hashCase;
    //TODO: Future get from token, now just trusting the message body...
    let hospital: string = req.body.hospital;
    console.log("-> hospital", hospital);
    try{
    GoDataLicenses.find({hashId: hashId}).then((goDataLicenses) => {
        if (!Array.isArray(goDataLicenses) || !goDataLicenses.length) {
            res.status(404).send({error: {message: "Case not found, erroneous hashid", status: 404}});
        } else {
            let isFound = false;
            goDataLicenses.forEach((goDataLicense) => {
                if (goDataLicense) {
                    goDataLicense.keys.forEach((key) => {
                        if (key.hospital.toString().toLowerCase() === hospital.toLowerCase()) {
                            //We will return the key encrypted with the public key, so only the
                            // hospital or user with private key can decrypt and get the symmetric key!
                            isFound = true;
                            return res.status(200).send({
                                "license": key.usedKey
                            });
                        }
                    });
                }
            });
            // None found
            if (!isFound) {
                return res.status(404).send({error: {message: "Permission required for the case", status: 404}});
            }
        }
    });
    }catch(err){
        console.log("Error while getting GoDataLicense " + err);
        return res.status(500).send({error: {message: "Server error, try again", status: 500}});
    }
}

async function dataKeyTransfer(req:Request, res: Response){

    //Only an existent user of a case, can transfer the key to some other hospital
    let hospital = req.body.hospital; // TODO: Retrieve from token!
    let hospitalToTransfer = req.body.hospitalToTransfer; // Directly in the json as nothing personal
    console.log("Transfer Solicited for "+hospitalToTransfer);
    let hashId = req.body.hashId;
    //We need both the private key of the existent user and the private key of the transfer user
    // First we find that the hospital exists
    let managerUser = await User.findOne({ hospital: config.HOSPITAL});
    if(!managerUser){
        return res.status(500).send({error: { message:"Cannot transfer, server error" ,status:500}});
    }
    let targetUser =  await User.findOne({ hospital: hospitalToTransfer});
    //User exists
    if(!targetUser){
        return res.status(404).send({error: { message:"Cannot transfer, target hospital doesn't exist" ,status:404}});
    }
    // Contains the symmetric key!
    GoDataLicenses.findOne({ hashId: hashId}).then((licenseToTransfer)=>{
        if(licenseToTransfer){
            // GoDataLicense found...
            let i = 0;
            // First we check if the hospital has permission for this case
            while (licenseToTransfer.keys[i].hospital.toString() !== hospital) {
                i = i + 1;
                if(licenseToTransfer.keys.length===i){
                    return res.status(401).send({error: { message:"Unauthorized, doesn't has permission" ,status:500}});
                }
            }
            const keyPositionHosp = i;
            i=0;
            // Find where the hospitalName is equal to manager, inside the licenses...
            // As we don't have access to hospital private key, the only way to transfer is using the private key
            // of the manager/administrator
            while (licenseToTransfer.keys[i].hospital.toString() !== config.HOSPITAL) {
                i = i + 1;
                if(licenseToTransfer.keys.length===i){
                    console.error("Admin not found, for license case id: ", hashId);
                    return res.status(500).send({error: { message:"Server error, please contact administrator" ,status:500}});
                }
            }
            
            //User exists
            if(targetUser){
                //Target user actually exists
                // Step1. Decrypt the symmetric key from the License
                let encryptedKey:string = licenseToTransfer.keys[i].usedKey;
                // @ts-ignore
                let keyDecrypted:string = encryptRSA.decryptKeyRSA(managerUser.privateKey,encryptedKey);
                // Step2. Encrypt the symmetric key from the public key of transferUser
                let keyEncrypted:string = encryptRSA.encryptKeyRSA(targetUser.publicKey,keyDecrypted);
                // Step3. Add they key to the License with other keys
                let newKey =
                    {
                        usedKey : keyEncrypted,
                        hospital:targetUser.hospital
                    };
                const queryUpdate = { _id: licenseToTransfer._id };
                
                GoDataLicenses.updateOne( queryUpdate, { "$push": { keys: newKey } }).then( (updateRes)=> {
                // Step4. Notify user, that the transfer was successful
                    return res.status(201).send({"message": "Transfer completed successfully"});
                } ).catch( ( err ) =>
                {
                    return res.status(500).send({error: { message:"Transfer incomplete, try again later." ,status:500}});
                });
            }else{
                return res.status(404).send({error: { message:"Transfer failed, Target user doesn't exist." ,status:404}});
            }
        }else{
            return res.status(404).send({error: { message:"No license found for this caseId" ,status:404}});
        }
    });

}
export default { login, register, getKeyOfCase, dataKeyTransfer }
