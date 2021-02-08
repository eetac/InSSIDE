//Class in charge of sending and receiving from the AP of Go.Data the cases and encrypt it
import {Request, Response} from "express";
import * as http from 'typed-rest-client/HttpClient';
import {IHeaders, IHttpClientResponse} from "typed-rest-client/Interfaces";
import {ConfigurationData} from './config'

import crypto from 'crypto'
import User, { IUser } from "../models/user";
import GoDataLicenses,{IGoDataLicensesSchema} from "../models/godataLicenses";
import { default as encryptRSA } from '../helpers/encryptRSA';
const config: ConfigurationData = new ConfigurationData();
const IV_LENGTH = 16;
export class EncryptCases {

  //Function that get from the API all the actual cases and 
  //encrypt the ones that are not encrypted yet
  public async encryptCases(req: Request, res: Response) {

    let cases = await this.getCases();

    //for all the cases we encrypt if is needed the sensible data
    let fieldsModified: Number = 0;
    for (let i = 0; i < cases.length; i++) {
      //console.log("STEP0 --> CASE: " + cases[i])
      //First we need to know who have added this case to Go.Data and generate the hash of the case
      let creator = cases[i].createdBy;
      let creatorEmail = await this.getEmailCreator(cases[i].createdBy)
      console.log("STEP1 --> EMAIL CREATOR: " + creatorEmail)
      let encryptionKey = crypto.randomFillSync(Buffer.alloc(32)).toString('hex');
      let iv = crypto.randomBytes(IV_LENGTH);
      console.log("STEP2 --> ENCRYPTION KEY: " + encryptionKey)
      // All cases must be anonymized & so the sensitive field
      // defined in the config.ts must be encrypted

      //Now for each field sensitive it is encrypted
      config.sensitiveData.forEach(sensitiveField => {

        let sensitiveFieldLength = sensitiveField.split(",").length; //If there is a subSensitiveField like  address,phoneNumber

        if (sensitiveFieldLength == 1) { //We don't need to split because sensitiveField doesn't have subSensitiveField

          // If the beginning of the value is different of /ENC
          // (so it has not been encrypted yet) we encrypt the field and add /ENC/creatorEmail at the beggining
          if (cases[i][sensitiveField].substring(0, 5) != "/ENC/") {
            fieldsModified = 1; //Field Modified
            let encryptedField: String = EncryptCases.encrypt(cases[i][sensitiveField], encryptionKey,iv);
            /*console.log(encryptedField);*/
            cases[i][sensitiveField] = "/ENC/" + creatorEmail + "/" + encryptedField;
          }
        }
        else { //had sensitiveField configured in config with internal subfields of the objects stored in a array
          let subSensitiveField = sensitiveField.split(",");
            // Documents which contains a list of documents such as nationality, archived_id etc, so
            // need to go over each document and encrypt the number of that document which we want to protect
            // Also applies for addresses, which might contain phone and addresses
          let fieldObjectsLength = cases[i][subSensitiveField[0]].length;
            for(let subSensitiveFields=0;subSensitiveFields<fieldObjectsLength;subSensitiveFields++){
              if (cases[i][subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]].substring(0, 5) != "/ENC/") { //if is not encrypted
                fieldsModified = 1; //SetModified
                let fieldNeededEncryption = cases[i][subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]];
                let encryptedField: String = EncryptCases.encrypt(fieldNeededEncryption, encryptionKey,iv);
                /*console.log(encryptedField)*/
                cases[i][subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = "/ENC/" + creatorEmail + "/" + encryptedField
              }
          }
        }
      });

      if (fieldsModified != 0) {
        // We update only the cases where we have encrypted data, and if the key save was success
        // we don't want to update case, if the key is not saved. As impossible to recover...
        // Only update if key encryption didn't fail --> await this.updateCase(cases[i]);
        let keys;
        //We encrypt the key with the RSA Keys of Admin user and same for the Hospital
        await User.findOne({ username: "admin" }).then((managerUser)=>{
          if(managerUser!=null){
          let keyEncrypted:string = encryptRSA.encryptKeyRSA(managerUser.publicKey,encryptionKey);
            User.findOne({ username: creatorEmail }).then((hospUser)=>{
              if(hospUser!=null){
                /*let secret = encryptKeyRSA(publicKey,"secret-string");
                let secretBuffer = decryptKeyRSA(privateKey,secret);
                let secretInString = Buffer.from(secretBuffer).toString('utf-8');*/
                let keyEncryptedHospital:string = encryptRSA.encryptKeyRSA(hospUser.publicKey,encryptionKey); /*this.encryptKeyRSA(hospUser.publicKey,encryptionKey);*/
                //Both admin & hospitalUser exists
                keys = [
                  {
                    hospitalName: "admin",
                    usedKey: keyEncrypted
                  },
                  {
                    hospitalName: creatorEmail,
                    usedKey: keyEncryptedHospital
                  }
                ];
                const newGoDataLicenseCase = new GoDataLicenses({
                  caseId: cases[i]['id'],
                  creatorEmail: creatorEmail,
                  keys:keys }); //New entry in our DRM server to store the keys
                /*console.log("STEP7 --> new Entry: " + newGoDataLicenseCase)*/
                newGoDataLicenseCase.save().then((data) => {
                  return res.status(201).send({ message: "Encrypted" });

                }).catch((err) => {
                  console.log(err)
                  return res.status(500).json({ message: "Case not encrypted:  "+ err });
                })
              }else{
                //Hospital, if the hospital does not exist in our DB we only save the keys of the admin
                keys = [
                  {
                    hospitalName: "admin",
                    usedKey: keyEncrypted
                  }];
                const newGoDataLicenseCase = new GoDataLicenses({
                  caseId: cases[i]['id'],
                  creatorEmail: creatorEmail,
                  keys:keys }); //New entry in our DRM server to store the keys
                /*console.log("STEP7 --> new Entry: " + newGoDataLicenseCase)*/
                newGoDataLicenseCase.save().then((data) => {
                  //Update the data in GoData when actually everything correct!!!!
                  this.updateCase(cases[i]).then((_)=>{
                    return res.status(201).send({ message: "Encrypted" });
                  })
                }).catch((err) => {
                  console.log(err)
                  return res.status(500).json({ message: "Case not encrypted:  "+ err });
                })
              }
            }).catch((err)=>{
              console.log("Error in database, while searching for hospital: "+creatorEmail);
              return res.status(500).json({ message: "Case not encrypted:  "+ err });
            });
          }else{
            console.log("Failed trying to encrypt the case Key for admin user, admin not found in database!");
            return res.status(500).json({ message: "Case not encrypted, admin not found" });
          }

        }).catch((err)=>{
          console.log("Failed trying to encrypt the case Key for admin user: "+err.message);
          return res.status(500).json({ message: "Failed trying to encrypt the case Key for admin user:  "+ err });
        });

        //Resetting for next case!
        fieldsModified = 0 //Reset
      }
    }
  }


  //Function where the user pass the id of a case and return the case decrypted
  public async decryptCase(req: Request, res: Response) {

   /* let spCase = await this.getSpecificCase(req.body.caseId);*/
    let username = req.body.username; //TODO: From Token in future release! temporary only!
    let caseId = req.body.caseId;
    //Once we have the case we need to check to get the key to decrypt that is encrypted with pubkey of Hosp

    //Once we have the hash we need to find the key for the case that is already stored in the client with the getKey
    //Just for test we put the key already decrypted
    //keyDecrypted = af44f60c2c308c7904abaa211970c63201114eaf6a0ede5724b3fd9506967da9
    User.findOne({ username: username}).then((hospitalUser)=>{
      if(hospitalUser!=null){
        GoDataLicenses.findOne({ caseId: caseId}).then((goDataLicense)=>{
          if(goDataLicense!=null){
            // GoDataLicense found...
            let i = 0;
            // Find where the hospitalName is equal to username, inside the licenses...
            while (goDataLicense.keys[i].hospitalName.toString() != username) {
              i = i + 1;
              if(goDataLicense.keys.length==i){
                return res.status(404).send({"error": "Don't have permission for the case"});
              }
            }
            if (goDataLicense.keys[i].hospitalName.toString() == username) {
              //We will return the key encrypted with the public key, so only the
              // hospital or user with private key can decrypt and get the symmetric key!
              const encrypt: EncryptCases = new EncryptCases;
              encrypt.getCase(caseId).then((spCase) => {
                if (spCase.error == null) {
                  //No error in the response, means correct result
                  //Both username and case exists
                  let encryptedKey:string = goDataLicense.keys[i].usedKey;
                  //let encryptedBufferKey:Buffer = new Buffer(encryptedKey, 'base64');

                  let keyDecrypted:string = encryptRSA.decryptKeyRSA(hospitalUser.privateKey,encryptedKey);
                  console.log("key Decrypted: " +keyDecrypted);
                  //Decrypting
                  config.sensitiveData.forEach(sensitiveField => {
                    let subSensitiveField = sensitiveField.split(",");
                    //If there is a document we have address,phoneNumber
                    if (subSensitiveField.length == 1) {
                      //If the beginning of the value is equal to /ENC/ we decrypt the field
                      if (spCase[sensitiveField].substring(0, 5) == "/ENC/") {
                        let sensitiveFieldValueSplit = spCase[subSensitiveField[0]].split("/");
                        let offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                        let encryptedFieldValue = spCase[subSensitiveField[0]].substring(offsetEncryptedFieldValue,);
                        /*let valueToDecrypt = spCase[sensitiveField].substring(42,)*///from 42 because after /ENC/ we have the id of the creator
                        let decryptedField: String = EncryptCases.decrypt(encryptedFieldValue, keyDecrypted);
                        spCase[sensitiveField] = decryptedField
                      }
                    }
                    else {
                      // Has sensitiveField configured in config with internal subfields of the objects stored in a array
                      // Documents which contains a list of documents such as nationality, archived_id etc, so
                      // need to go over each document and encrypt the number of that document which we want to protect
                      // Also applies for addresses, which might contain phone and addresses
                      let fieldObjectsLength = spCase[subSensitiveField[0]].length;
                      for (let subSensitiveFields = 0; subSensitiveFields < fieldObjectsLength; subSensitiveFields++) {
                        let sensitiveFieldValueSplit = spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]].split("/");
                        let offsetEncryptedFieldValue = sensitiveFieldValueSplit[1].length + sensitiveFieldValueSplit[2].length + 3;
                        let encryptedFieldValue = spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]].substring(offsetEncryptedFieldValue,);
                        if (sensitiveFieldValueSplit[1] == "ENC") { //if is encrypted
                          let decryptedField: String = EncryptCases.decrypt(encryptedFieldValue, keyDecrypted);
                          spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
                        }
                      }
                    }
                  });
                  res.status(200).send(spCase);
                } else {
                  return res.status(404).send({"error": "Case not found, erroneous id!"});
                }
              }).catch((err) => {
                //Some error, can't retrieve case
                console.log(err);
                return res.status(500).send({"error": "Server error, while trying to find case!"});
              });
            }else{
              // User hasn't got permission to view the case nether the key
              return res.status(404).send({"error": "Don't have permission for the case"});
            }
          }else{
            res.status(404).send({"error": "Case not found, erroneous id!"});
          }
        }).catch((err)=>{
          console.log("Error while getting GoDataLicense "+err);
          return res.status(500).send({"error": "Server error, please try again"});
        });
      }else{
        return res.status(404).send({"error": "User doesn't exist"});
      }
    }).catch((err)=>{
      return res.status(500).send({"error": "Server error, please check the fields are as required"});
    });

  }

  public async getCase(caseId:string): Promise<any>{
    return new Promise((resolve,reject )=> {
      //First we get the token then get the cases
      this.auth().then((token)=>{
        const url: string = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`;
        this.doGet(url).then((response)=>{
          return resolve(JSON.parse(response));
        }).catch((err)=>{
          return reject(err);
        })
      }).catch((err)=>{
        return reject(err);
      });
    });
  }
  public async getCases(): Promise<any> {
    //First we get the token then get the cases
    let token: String = await this.auth();
    let response = await this.doGet(`${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases?access_token=${token}`);
    let cases = JSON.parse(response)
    return cases;
  }
  private async getSpecificCase(caseId: String): Promise<any> {
    let token: String = await this.auth();
    let response = await this.doGet(`${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`);
    let specificCase = JSON.parse(response)
    return specificCase;
  }
  private async updateCase(body: any){
    return new Promise((resolve,reject )=> {
    //Update the case
    this.auth().then((token)=>{
      const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${body.id}?access_token=${token}`;
      this.doPut(url, body).then((_)=>{
        resolve(true);
      }).catch((err)=>{
        console.log("Error while updating Case to goData: "+err);
        return reject(err);
      })
    }).catch((err)=>{
      return reject(err);
    });
  });
  }

  public static encrypt(text:string, ENCRYPTION_KEY:string, iv:Buffer) {
    const algorithm = 'aes-256-ctr';
    //let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  public static decrypt(encryptText:string, ENCRYPTION_KEY:string) {
    const algorithm = 'aes-256-ctr';
    let textParts = encryptText.split(':');
    // @ts-ignore
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
  private getEmailCreator(idCreator: string):Promise<string>{
    return new Promise((resolve,reject )=> {
    //Here we search the email of the creator of the case to then save in our DB
    let id: string = idCreator;//req.params.hashCase;
    this.auth().then((token)=>{
      const url: string = `${config.URL}/users/${id}?access_token=${token}`;
      this.doGet(url).then((res)=>{
        let user = JSON.parse(res);
        return resolve(user.email);
      }).catch((err)=>{
        return reject(err);
      })
    }).catch((err)=>{
      return reject(err);
    });
  });
  }


  public async doGet(url: string):Promise<string>{
    return new Promise((resolve,reject )=> {
    const client = new http.HttpClient(config.USER_AGENT);
    let response: IHttpClientResponse;

    const headers: IHeaders = {
      "Accept": "application/json",
      "Content-Type": 'application/json; charset=utf-8'
    };

    console.log(`URL: ${url}`);

      client.get(url, headers).then((response)=>{
        //Response ok
        if(response!=null){
          response.readBody().then((result)=>{
            if(result!=null){
              const statusCode = response.message.statusCode;
              console.log("STATUS CODE " + statusCode);
              /*console.log(`RESULT: ${result}`);*/
              resolve(result);
              return;
            }
            else{
              reject(new Error("response on reading body was null, on post: "+url));
              return;
            }
          }).catch((err)=>{
            reject(err);
            return;
          });
        }else{
          reject(new Error("response was null, on post"+url));
          return;
        }
      }).catch((err)=>{
        console.log("HTTP Client Post Error: "+err);
        reject(err);
        return;
      });
  });
  }


  private async doPost(url: string, body: any):Promise<string>{
    return new Promise((resolve,reject )=> {
    const client = new http.HttpClient(config.USER_AGENT);
    let response: IHttpClientResponse;

    const headers: IHeaders = {
      "Accept": "application/json",
      "Content-Type": 'application/json; charset=utf-8'
    };
    const data = JSON.stringify(body);
      client.post(url, data, headers).then((response)=>{
        //Response ok
        if(response!=null){
          response.readBody().then((result)=>{
            if(result!=null){
              resolve(result);
              return;
            }
            else{
              reject(new Error("response on reading body was null, on post: "+url));
              return;
            }
          }).catch((err)=>{
            reject(err);
            return;
          });
        }else{
          reject(new Error("response was null, on post"+url));
          return;
        }
      }).catch((err)=>{
        console.log("HTTP Client Post Error: "+err);
        reject(err);
        return;
      });
  });
  }

  private async doPut(url: string, body: any){
    return new Promise((resolve,reject )=> {
    //Para realizar peticiones HTTP PUT a Go.Data
    const client = new http.HttpClient(config.USER_AGENT);
    let response: IHttpClientResponse;

    const headers: IHeaders = {
      "Accept": "application/json",
      "Content-Type": 'application/json; charset=utf-8'
    };
    const data = JSON.stringify(body);
    console.log(`URL: ${url}`);
    /*console.log(`BODY: ${data}`);*/

      client.put(url, data, headers).then((response)=>{
        //Response ok
        if(response!=null){
          response.readBody().then((result)=>{
            if(result!=null){
              resolve(result);
              return;
            }
            else{
              reject(new Error("response on reading body was null, on post: "+url));
              return;
            }
          }).catch((err)=>{
            reject(err);
            return;
          });
        }else{
          reject(new Error("response was null, on post"+url));
          return;
        }
      }).catch((err)=>{
        console.log("HTTP Client Post Error: "+err);
        reject(err);
        return;
      });
  });}



  public async auth():Promise<string>{
    return new Promise((resolve,reject )=> {
    const url = `${config.URL}/users/login`;
    const body = {
      email: config.USER,
      password: config.PASSWORD
    }

    this.doPost(url, body).then((result)=>{
      const json = JSON.parse(result);
      resolve(json.id);
      return;
    }).catch((err)=>{
      console.log("Error doing a post inside authentication: "+err);
      reject(err);
      return;
    });
  });}

}