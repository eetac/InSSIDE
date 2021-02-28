"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const goDataHelper_1 = __importDefault(require("../helpers/goDataHelper"));
const user_1 = __importDefault(require("../models/user")); //We send a message to the client
const cipherRSA_1 = __importDefault(require("../helpers/cipherRSA"));
const godataLicense_1 = __importDefault(require("../models/godataLicense"));
const Bcrypt = require('bcrypt');
const crypto = require("crypto");
async function login(req, res) {
    console.log('Log in -> username: ' + req.body.username + ' ' + req.body.password);
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ 'msg': 'You need to send username and password' });
    }
    user_1.default.findOne({ username: req.body.username }).then((user) => {
        if (user != null) {
            if (Bcrypt.compareSync(req.body.password, user.password)) {
                console.log("Login Successfull");
                res.status(200).send({ message: 'Login Successfull' });
            }
            else {
                console.log("Login Failed, The username and password don\'t match.");
                return res.status(400).send({ message: 'The username and password don\'t match.' });
            }
        }
        else {
            console.log("Login Failed, Failed while trying to login, now user found");
            res.status(400).send({ message: 'Failed while trying to login, now user found' });
        }
    }).catch((err) => {
        console.log("Login Failed, Failed while trying to login");
        return res.status(500).send({ message: 'Failed while trying to login' });
    });
}
async function register(req, res) {
    const username = req.body.username;
    console.log(req.body);
    let existUser = await user_1.default.findOne({ username: username });
    if (existUser) {
        res.status(403).json({ message: "Already exist a user with this username" });
    }
    else {
        // We need the managerUser to encrypt the private key of other users
        /*let managerUser = new User(await User.findOne({ username: "admin" }));*/
        //When we want to add new user we need to generate RSA keys
        //We need to hash the password
        const saltRounds = 10;
        let password = Bcrypt.hashSync(req.body.password, saltRounds);
        // RSA Private and Public Key in PEM format, if we need to export the key as a file ##FUTURE!
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            }
        });
        let newUser = new user_1.default({
            username: req.body.username,
            contactInfo: req.body.contactInfo,
            password: "password-hidden",
            publicKey: publicKey,
            privateKey: privateKey
        });
        // New user will be sent to the user who just registered, on top of that we need to encrypt the private key itself
        // with the user password, so that even on a db leak, all of the data is protected by hospital key!
        // FUTURE--> For now no encryption, as the hospital should be able to ask for a password change!
        newUser.save().then((data) => {
            console.log('User added successfully');
            res.status(201).json(newUser);
        }).catch((err) => {
            console.log(err);
            res.status(500).json({ message: err });
        });
    }
}
async function getKeyOfCase(req, res) {
    //Hospital ask for the decryption key of a case and DRM return the key encrypted with the pubKey for security reasons
    let caseId = req.body.caseId; //req.params.hashCase;
    //TODO: Future get from token, now just testing...
    let username = req.body.username;
    godataLicense_1.default.findOne({ caseId: caseId }).then((goDataLicense) => {
        if (goDataLicense != null) {
            // GoDataLicense found...
            let i = 0;
            // Find where the hospitalName is equal to username, inside the licenses...
            while (goDataLicense.keys[i].hospitalName.toString() != username) {
                i = i + 1;
                if (goDataLicense.keys.length == i) {
                    return res.status(404).send({ "error": "Don't have permission for the case" });
                }
            }
            if (goDataLicense.keys[i].hospitalName.toString() == username) {
                //We will return the key encrypted with the public key, so only the
                // hospital or user with private key can decrypt and get the symmetric key!
                goDataHelper_1.default.getCase(caseId).then((caseResponse) => {
                    if (caseResponse.error == null) {
                        //No error in the response, means correct result
                        return res.status(200).send({
                            "keyUsed": goDataLicense.keys[i].usedKey,
                            "spCase": caseResponse
                        });
                    }
                    else {
                        return res.status(404).send({ "error": "Case not found, erroneous id!" });
                    }
                }).catch((err) => {
                    //Some error, can't retrieve case
                    console.log(err);
                    return res.status(500).send({ "error": "Server error, while trying to find case!" });
                });
            }
            else {
                // User hasn't got permission to view the case nether the key
                return res.status(404).send({ "error": "Don't have permission for the case" });
            }
        }
        else {
            res.status(404).send({ "error": "Case not found, erroneous id!" });
        }
    }).catch((err) => {
        console.log("Error while getting GoDataLicense " + err);
        return res.status(500).send({ "error": "Server error, please try again" });
    });
}
async function dataKeyTransfer(req, res) {
    //Only an existent user of a case, can transfer the key to some other hospital
    let username = req.body.username; // TODO: Future retrieve from token!
    let usernameToTransfer = req.body.usernameToTransfer; // Directly in the json as nothing personal
    console.log("Transfer Solicited for " + usernameToTransfer);
    let caseId = req.body.caseId;
    //We need both the private key of the existent user and the private key of the transfer user
    // First we find that the username exists
    let existentUser = await user_1.default.findOne({ username: username });
    if (existentUser == null) {
        return res.status(400).send({ "error": "Cannot transfer,User doesn't exist" });
    }
    let targetUser = await user_1.default.findOne({ username: usernameToTransfer });
    // Contains the symmetric key!
    godataLicense_1.default.findOne({ caseId: caseId }).then((licenseToTransfer) => {
        if (licenseToTransfer != null) {
            /* let JsonLicenseToTransfer = licenseToTransfer;
             console.log(JsonLicenseToTransfer);*/
            // GoDataLicense found...
            let i = 0;
            // Find where the hospitalName is equal to username, inside the licenses...
            while (licenseToTransfer.keys[i].hospitalName.toString() != username) {
                i = i + 1;
                if (licenseToTransfer.keys.length == i) {
                    return res.status(404).send({ "error": "Don't have permission for the case" });
                }
            }
            if (licenseToTransfer.keys[i].hospitalName.toString() == username) {
                //User exists
                if (targetUser != null) {
                    //Target user actually exists
                    // Step1. Decrypt the symmetric key from the License
                    let encryptedKey = licenseToTransfer.keys[i].usedKey;
                    // @ts-ignore
                    let keyDecrypted = cipherRSA_1.default.decryptKeyRSA(existentUser.privateKey, encryptedKey);
                    // Step2. Encrypt the symmetric key from the public key of transferUser
                    let keyEncrypted = cipherRSA_1.default.encryptKeyRSA(targetUser.publicKey, keyDecrypted);
                    // Step3. Add they key to the License with other keys
                    let newKey = {
                        hospitalName: targetUser.username,
                        usedKey: keyEncrypted
                    };
                    const queryUpdate = { _id: licenseToTransfer._id };
                    godataLicense_1.default.updateOne(queryUpdate, { "$push": { keys: newKey } }).then((updateRes) => {
                        //console.debug( "Chat added to user:  ", updateRes );
                        // Step4. Notify user, that the transfer was successfull
                        return res.status(201).send({ "message": "Transfer completed successfully" });
                    }).catch((err) => {
                        return res.status(400).send({ "error": "No update completed, unknown error while updating" });
                    });
                }
                else {
                    return res.status(400).send({ "error": "Cannot transfer,TargetUser doesn't exist" });
                }
            }
            else {
                return res.status(404).send({ "error": "Cannot transfer,User doesn't have permission either" });
            }
        }
        else {
            return res.status(404).send({ "error": "No license exists, with this caseId" });
        }
    });
}
exports.default = { login, register, getKeyOfCase, dataKeyTransfer };