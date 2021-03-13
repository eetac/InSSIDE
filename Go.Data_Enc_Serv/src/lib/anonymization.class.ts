import crypto from 'crypto'
import User from "../models/user";
const config = require('../configurations/config');
import GoDataLicenses,{IGoDataLicensesSchema} from "../models/godataLicense";
import asymmetricCipher from '../helpers/cipherRSA';
import goDataHelper from "../helpers/goDataHelper";
import symmetricCipher from "../helpers/cipherAES";
const Bcrypt = require('bcrypt');

interface IResult{
    message:string,
    statusCode:number
}
/**
 * Encrypts all of the case, under admin
 * But remember to configure the config.ts properly
 * with the GoData username,password and the outbreak
 * which requires protection.
 * Examples:
 *
 *    localhost:3000/encrypt
 *
 */
function encryptCases(cases:any): Promise<IResult>{
    return new Promise(async (resolve,reject )=> {

        //for all the cases we encrypt if is needed the sensible data
        let fieldsModified: Number = 0;
        for (let i = 0; i < cases.length; i++) {
            //console.log("STEP0 --> CASE: " + cases[i])
            //First we need to know who have added this case to Go.Data and generate the hash of the case
            //let creator = cases[i].createdBy;
            let creator = await goDataHelper.getInstituteCreator(cases[i].createdBy);
            console.log("STEP1 --> Institution CREATOR: " + creator)
            let encryptionKey = crypto.randomFillSync(Buffer.alloc(32)).toString('base64');
            let iv = crypto.randomBytes(config.IV_LENGTH);
            console.log("STEP2 --> ENCRYPTION KEY: " + encryptionKey)
            // All cases must be anonymized & so the sensitive field
            // defined in the config.ts must be encrypted

            // First we go over each sensitive field, search in the case for the field and encrypt
            config.SENSITIVEDATA.forEach(sensitiveField => {

                let sensitiveFieldLength = sensitiveField.split(",").length; //If there is a subSensitiveField like  address,phoneNumber
                /*console.log("sensitiveField: "+sensitiveField);*/
                if (sensitiveFieldLength == 1) { //We don't need to split because sensitiveField doesn't have subSensitiveField

                    // If the beginning of the value is different of /ENC
                    // (so it has not been encrypted yet) we encrypt the field and add /ENC/creatorEmail at the beginning
                    if(cases[i][sensitiveField]!=null){
                    console.log(`${sensitiveField}: ${cases[i][sensitiveField]}`);
                        if (cases[i][sensitiveField].substring(0, 5) != "/ENC/") {
                            fieldsModified = 1; //Field Modified
                            let encryptedField: String = symmetricCipher.encryptSymmetric(cases[i][sensitiveField], encryptionKey,iv);
                            console.log("Encrypted Val: "+encryptedField);
                            /*console.log(encryptedField);*/
                            cases[i][sensitiveField] = "/ENC/" + creator + "/" + encryptedField;
                        }
                    }else{
                        console.log(`${sensitiveField}: is null, not encrypting`);
                    }
                }
                else { //had sensitiveField configured in config with internal subfields of the objects stored in a array
                    let subSensitiveField = sensitiveField.split(",");
                    // Documents which contains a list of documents such as nationality, archived_id etc, so
                    // need to go over each document and encrypt the number of that document which we want to protect
                    // Also applies for addresses, which might contain phone and addresses
                    /*let fieldObjectsLength = ;*/
                    if(cases[i][subSensitiveField[0]]!=null){
                        for(let k=0; k<cases[i][subSensitiveField[0]].length; k++){
                            //Cannot Encrypt Other Document as this contains the CIP HASH!
                            if (!(subSensitiveField[0] == "documents" && cases[i][subSensitiveField[0]][k]["type"].toString() == config.DOCUMENT_HASH)) {
                                let subField:string  = subSensitiveField[1];
                                if(subSensitiveField[0] == "documents"){
                                    subField = cases[i][subSensitiveField[0]][k]["type"].split("_")[6];
                                }
                                console.log(`${subField}: ${cases[i][subSensitiveField[0]][k][subSensitiveField[1]]}`);
                                if (cases[i][subSensitiveField[0]][k][subSensitiveField[1]].substring(0, 5) != "/ENC/") { //if is not encrypted
                                    fieldsModified = 1; //SetModified
                                    let fieldNeededEncryption = cases[i][subSensitiveField[0]][k][subSensitiveField[1]];
                                    let encryptedField: String = symmetricCipher.encryptSymmetric(fieldNeededEncryption, encryptionKey, iv);
                                    /*console.log(encryptedField)*/
                                    cases[i][subSensitiveField[0]][k][subSensitiveField[1]] = "/ENC/" + creator + "/" + encryptedField
                                }
                            }
                        }
                    }else{
                        console.log(`${subSensitiveField[0]} is null, not encrypting this field!`);
                    }
                }
            });
            console.log("fields Modified: "+fieldsModified);
            if (fieldsModified != 0) {
                // We update only the cases where we have encrypted data, and if the key save was success
                // we don't want to update case, if the key is not saved. As impossible to recover...
                // Only update if key encryption didn't fail --> await this.updateCase(cases[i]);
                console.log("Entered Update Case and Insertion License");
                let keys;
                //We encrypt the key with the RSA Keys of Admin user and same for the Hospital
                User.findOne({ username: "admin" }).then((managerUser)=>{
                    /* console.log("managerUser: "+managerUser); */
                    if(managerUser!=null){
                        // Now hash the CIP, as this will provide the merge capability between same cases from different hospital
                        // without needing to decrypt the actual information of the patient/case
                        let positionCIP = 0;
                        let cipExists:boolean = false;
                        /* while (cases[i]["documents"][positionCIP]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP") {
                            positionCIP = positionCIP + 1;
                            if(positionCIP== cases[i]["documents"].length){
                                console.log( `Case not encrypted, need to provide valid CIP for case: ${cases[i]["id"]}`);
                            }
                        } */
                        for(let docuIndx=0; docuIndx<cases[i]["documents"].length; docuIndx++){
                            if(cases[i]["documents"][positionCIP]["type"] == "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP"){
                                cipExists = true;
                                positionCIP = docuIndx;
                                /* console.log("...............CIP FOUND........................."); */
                                break;
                            }
                        }
                        if(cipExists){
                            let fullFieldsToHash = cases[i]["documents"][positionCIP]["number"].toUpperCase();
                            let cipHash = Bcrypt.hashSync(fullFieldsToHash,config.saltRounds);
                            cases[i]["documents"][cases[i]["documents"].length] = {
                                "type": "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP_HASH",
                                "number": cipHash
                            };
                            /* console.log("Case Edited: \n"+cases[i]); */
                            let keyEncrypted:string = asymmetricCipher.encryptKeyRSA(managerUser.publicKey,encryptionKey);
                            //Hospital, if the hospital does not exist in our DB we only save the keys of the admin
                            keys = [
                                {
                                    hospitalName: "admin",
                                    usedKey: keyEncrypted
                                }];
                            const newGoDataLicenseCase:IGoDataLicensesSchema = new GoDataLicenses({
                                caseId: cases[i]['id'],
                                hashId:cipHash,
                                creatorEmail: creator,
                                keys:keys }); //New entry in our DRM server to store the keys
                            console.log("STEP4 --> new License created: " + newGoDataLicenseCase)
                            newGoDataLicenseCase.save().then((data) => {
                                console.log("STEP5 --> Case Updated: " + data)
                                //Update the data in GoData when actually everything correct!!!!
                                goDataHelper.updateCase(cases[i]).then((resLicense)=>{
                                    console.log("STEP6 --> Case Updated: " + resLicense)
                                }).catch((err)=>{
                                    console.log(err);
                                    return reject({ message: "Case not encrypted:  "+ err  , statusCode: 500});
                                })
                            }).catch((err) => {
                                console.log(err)
                                return reject({ message: "Case not encrypted:  "+ err  , statusCode: 500});
                            })
                        }else{
                            console.log( `Case not encrypted, need to provide valid CIP for case: ${cases[i]["id"]}`);
                        }
                    }else{
                        console.log("Failed trying to encrypt the case Key for admin user, admin not found in database!");
                        return reject({ message: "Case not encrypted, admin not found"  , statusCode: 500});
                    }

                }).catch((err)=>{
                    console.log("Failed trying to encrypt the case Key for admin user: "+err.message);
                    return reject({ message: "Failed trying to encrypt the case Key for admin user:  "+ err , statusCode: 500 });
                });
                //Resetting for next case!
                fieldsModified = 0 //Reset
            }

        }
        return resolve({ message: "Encrypted" , statusCode: 200});
    });
}

/**
 * Decrypts the case, given username(token:Future) and caseId
 * Examples:
 *
 *    {"caseId":"bla-bla-bla","username":"admin"}
 *
 */
function decryptCases(username:string,hashId:string): Promise<IResult>{
    return new Promise((resolve,reject )=> {
        //Once we have the case we need to check to get the key to decrypt that is encrypted with publicKey of Hospital
        let decryptedCaseWithSensitiveFields:any = {};
        //Once we have the hash we need to find the key for the case that is already stored in the client with the getKey

        User.findOne({ username: username}).then((hospitalUser)=>{
            if(hospitalUser!=null){
                GoDataLicenses.findOne({ hashId: hashId}).then((goDataLicense)=>{
                    if(goDataLicense!=null){
                        // GoDataLicense found...
                        let i = 0;
                        // Find where the hospitalName is equal to username, inside the licenses...
                        while (goDataLicense.keys[i].hospitalName.toString() != username) {
                            i = i + 1;
                            if(goDataLicense.keys.length==i){
                                return reject({ message:  "Don't have permission for the case" , statusCode: 404});
                            }
                        }
                        if (goDataLicense.keys[i].hospitalName.toString() == username) {
                            //We will return the key encrypted with the public key, so only the
                            // hospital or user with private key can decrypt and get the symmetric key!
                            /*const encrypt: EncryptCases = new EncryptCases;*/
                            goDataHelper.getCase(goDataLicense.caseId).then((spCase) => {
                                if (spCase.error == null) {
                                    //No error in the response, means correct result
                                    //Both username and case exists
                                    let encryptedKey:string = goDataLicense.keys[i].usedKey;
                                    //let encryptedBufferKey:Buffer = new Buffer(encryptedKey, 'base64');

                                    let keyDecrypted:string = asymmetricCipher.decryptKeyRSA(hospitalUser.privateKey,encryptedKey);
                                    console.log("key Decrypted: " +keyDecrypted);
                                    let tes = config.SENSITIVEDATA;
                                    //Decrypting
                                    config.SENSITIVEDATA.forEach(sensitiveField => {
                                        let subSensitiveField = sensitiveField.split(",");
                                        //If there is a document we have address,phoneNumber
                                        if (subSensitiveField.length == 1) {
                                            //If the beginning of the value is equal to /ENC/ we decrypt the field
                                            if(spCase[sensitiveField]!=null){
                                                if (spCase[sensitiveField].substring(0, 5) == "/ENC/") {
                                                    let sensitiveFieldValueSplit = spCase[subSensitiveField[0]].split("/");
                                                    let offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                                                    let encryptedFieldValue = spCase[subSensitiveField[0]].substring(offsetEncryptedFieldValue,);
                                                    /*let valueToDecrypt = spCase[sensitiveField].substring(42,)*///from 42 because after /ENC/ we have the id of the creator
                                                    let decryptedField: String = symmetricCipher.decryptSymmetric(encryptedFieldValue, keyDecrypted);
                                                    //spCase[sensitiveField] = decryptedField
                                                    decryptedCaseWithSensitiveFields[sensitiveField] = decryptedField;
                                                }
                                            }else{
                                                console.log(`${sensitiveField} is null, not decrypting this field!`);
                                            }
                                        }
                                        else {
                                            // Has sensitiveField configured in config with internal subfields of the objects stored in a array
                                            // Documents which contains a list of documents such as nationality, archived_id etc, so
                                            // need to go over each document and encrypt the number of that document which we want to protect
                                            // Also applies for addresses, which might contain phone and addresses
                                            /*let fieldObjectsLength = spCase[subSensitiveField[0]].length;
                                            for (let subSensitiveFields = 0; subSensitiveFields < fieldObjectsLength; subSensitiveFields++) {*/
                                                if(spCase[subSensitiveField[0]]!=null){
                                                    spCase[subSensitiveField[0]].forEach((spCaseSubObject: any, index:  number)=>{
                                                        if (!(subSensitiveField[0] == "documents" && spCaseSubObject["type"].toString() == "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP_HASH")) {
                                                            let sensitiveFieldValueSplit = spCaseSubObject[subSensitiveField[1]].split("/");
                                                            let offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                                                            let encryptedFieldValue = spCaseSubObject[subSensitiveField[1]].substring(offsetEncryptedFieldValue,);
                                                            if (sensitiveFieldValueSplit[1] == "ENC") { //if is encrypted
                                                                let decryptedField: String = symmetricCipher.decryptSymmetric(encryptedFieldValue, keyDecrypted);
                                                                //spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
                                                                if(subSensitiveField[0] == "documents"){
                                                                    let documentTypeSplit = spCaseSubObject["type"].split("_");
                                                                    let documentType = documentTypeSplit.splice(6,documentTypeSplit.length-1).join('');
                                                                    decryptedCaseWithSensitiveFields[documentType] = decryptedField;
                                                                }else{
                                                                    decryptedCaseWithSensitiveFields[subSensitiveField[1]] = decryptedField;
                                                                }
                                                            }
                                                        }
                                                    });
                                                }else{
                                                    console.log(`${subSensitiveField[0]} is null, not decrypting this field!`);
                                                }
                                            /*}*/
                                        }
                                    });
                                    return resolve({ message: decryptedCaseWithSensitiveFields, statusCode: 200});
                                } else {
                                    return reject({ message: "Case not found, erroneous id!", statusCode: 404});
                                }
                            }).catch((err) => {
                                //Some error, can't retrieve case
                                console.log(err);
                                return reject({ message: "Server error, while trying to find case!", statusCode: 500});
                            });
                        }else{
                            // User hasn't got permission to view the case nether the key
                            return reject({ message: "Don't have permission for the case", statusCode: 404});
                        }
                    }else{
                        return reject({ message: "Case not found, erroneous id!", statusCode: 404});
                    }
                }).catch((err)=>{
                    console.log("Error while getting GoDataLicense "+err);
                    return reject({ message:  "Server error, please try again", statusCode: 500});
                });
            }else{
                return reject({ message: "User doesn't exist", statusCode: 404});
            }
        }).catch((err)=>{
            return reject({ message: "Server error, please check the fields are as required", statusCode: 500});
        });
    });
}

export default {
    encryptCases,
    decryptCases
}