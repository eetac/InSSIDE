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
const config = require('../configurations/config');
async function login(req, res) {
    console.log('Log in -> email: ' + req.body.email + ' ' + req.body.password);
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ error: { message: "Email/Password required", status: 400 } });
    }
    user_1.default.findOne({ email: req.body.email }).then((user) => {
        if (user != null) {
            if (Bcrypt.compareSync(req.body.password, user.password)) {
                console.log("Login Successful");
                res.status(200).send({ message: 'Login Successful', userGoDataId: user.userGoDataId });
            }
            else {
                console.log("Login Failed, The email and password don\'t match.");
                return res.status(400).send({ error: { message: "The email and password don\'t match.", status: 400 } });
            }
        }
        else {
            console.log("Login Failed, Failed while trying to login, now user found");
            res.status(400).send({ error: { message: 'Login Failed, email/Password Incorrect or Not Found!', status: 400 } });
        }
    }).catch((err) => {
        console.log("Login Failed, Failed while trying to login");
        return res.status(500).send({ error: { message: 'Failed while trying to login', status: 500 } });
    });
}
async function register(req, res) {
    const email = req.body.email;
    const goDataPassword = req.body.password;
    console.log(req.body);
    let existUser = await user_1.default.findOne({ email: email });
    if (existUser) {
        res.status(403).json({ error: { message: "Already exist a user with this email", status: 403 } });
    }
    else {
        //TODO: CHECK ON GO DATA IF LOGIN POSSIBLE AND USER EXITS
        goDataHelper_1.default.getGoDataUserId(email, goDataPassword).then((userGoDataId) => {
            // userGoDataId is found and thus user can be registered
            //When we want to add new user we need to generate RSA keys
            //We need to hash the password
            const saltRounds = 10;
            let password = Bcrypt.hashSync(goDataPassword, saltRounds);
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
                email: email,
                password: password,
                userGoDataId: userGoDataId,
                publicKey: publicKey,
                privateKey: privateKey
            });
            console.log(newUser);
            // New user will be sent to the user who just registered, on top of that we need to encrypt the private key itself
            // with the user password, so that even on a db leak, all of the data is protected by hospital key!
            // FUTURE--> For now no encryption, as the hospital should be able to ask for a password change!
            newUser.save().then((data) => {
                console.log('User added successfully');
                newUser.password = "password-hidden";
                res.status(201).json(newUser);
            }).catch((err) => {
                console.log(err);
                res.status(500).json({ error: { message: err, status: 500 } });
            });
        }).catch((err) => {
            //TODO: IF DOESN'T EXIST THAN DON'T ALLOW REGISTRATION!
            res.status(500).json({ error: { message: "Email/Password incorrect, doesn't exist on goData server", status: 500 } });
        });
    }
}
async function getKeyOfCase(req, res) {
    //Hospital ask for the decryption key of a case and DRM return the key encrypted with the pubKey for security reasons
    let caseId = req.body.caseId; //req.params.hashCase;
    //TODO: Future get from token, now just testing...
    let email = req.body.email;
    godataLicense_1.default.findOne({ caseId: caseId }).then((goDataLicense) => {
        if (goDataLicense != null) {
            // GoDataLicense found...
            let i = 0;
            // Find where the hospitalName is equal to email, inside the licenses...
            while (goDataLicense.keys[i].email.toString() != email) {
                i = i + 1;
                if (goDataLicense.keys.length == i) {
                    return res.status(404).send({ error: { message: "Permission required for the case", status: 404 } });
                }
            }
            if (goDataLicense.keys[i].email.toString() == email) {
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
                        return res.status(404).send({ error: { message: "Case not found on GoData", status: 404 } });
                    }
                }).catch((err) => {
                    //Some error, can't retrieve case
                    console.log(err);
                    return res.status(500).send({ error: { message: "Server error, try again", status: 500 } });
                });
            }
            else {
                // User hasn't got permission to view the case nether the key
                return res.status(404).send({ error: { message: "Permission required for the case", status: 404 } });
            }
        }
        else {
            res.status(404).send({ error: { message: "Case not found, erroneus id", status: 404 } });
        }
    }).catch((err) => {
        console.log("Error while getting GoDataLicense " + err);
        return res.status(500).send({ error: { message: "Server error, try again", status: 500 } });
    });
}
// TODO: FIX ME!!
async function dataKeyTransfer(req, res) {
    //Only an existent user of a case, can transfer the key to some other hospital
    let email = req.body.email; // TODO: Future retrieve from token!
    let emailToTransfer = req.body.emailToTransfer; // Directly in the json as nothing personal
    console.log("Transfer Solicited for " + emailToTransfer);
    let caseId = req.body.caseId;
    //We need both the private key of the existent user and the private key of the transfer user
    // First we find that the email exists
    let managerUser = await user_1.default.findOne({ email: config.USER });
    if (managerUser == null) {
        return res.status(500).send({ error: { message: "Cannot transfer, server error", status: 500 } });
    }
    let targetUser = await user_1.default.findOne({ email: emailToTransfer });
    //User exists
    if (targetUser == null) {
        return res.status(404).send({ error: { message: "Cannot transfer, target email doesn't exist", status: 404 } });
    }
    // Contains the symmetric key!
    godataLicense_1.default.findOne({ caseId: caseId }).then((licenseToTransfer) => {
        if (licenseToTransfer != null) {
            // GoDataLicense found...
            let i = 0;
            // Find where the hospitalName is equal to manager, inside the licenses...
            // As we don't have access to hospital private key, the only way to transfer is using the private key
            // of the manager/administrator
            while (licenseToTransfer.keys[i].email.toString() != config.USER) {
                i = i + 1;
                if (licenseToTransfer.keys.length == i) {
                    return res.status(500).send({ error: { message: "Server error, please contact administrator", status: 500 } });
                }
            }
            //User exists
            if (targetUser != null) {
                //Target user actually exists
                // Step1. Decrypt the symmetric key from the License
                let encryptedKey = licenseToTransfer.keys[i].usedKey;
                // @ts-ignore
                let keyDecrypted = cipherRSA_1.default.decryptKeyRSA(managerUser.privateKey, encryptedKey);
                // Step2. Encrypt the symmetric key from the public key of transferUser
                let keyEncrypted = cipherRSA_1.default.encryptKeyRSA(targetUser.publicKey, keyDecrypted);
                // Step3. Add they key to the License with other keys
                let newKey = {
                    usedKey: keyEncrypted,
                    userGoDataId: targetUser.userGoDataId,
                    email: targetUser.email
                };
                const queryUpdate = { _id: licenseToTransfer._id };
                godataLicense_1.default.updateOne(queryUpdate, { "$push": { keys: newKey } }).then((updateRes) => {
                    // Step4. Notify user, that the transfer was successfull
                    return res.status(201).send({ "message": "Transfer completed successfully" });
                }).catch((err) => {
                    return res.status(500).send({ error: { message: "Transfer incomplete, try again later.", status: 500 } });
                });
            }
            else {
                return res.status(404).send({ error: { message: "Transfer failed, Target user doesn't exist.", status: 404 } });
            }
        }
        else {
            return res.status(404).send({ error: { message: "No license found for this caseId", status: 404 } });
        }
    });
}
exports.default = { login, register, getKeyOfCase, dataKeyTransfer };
