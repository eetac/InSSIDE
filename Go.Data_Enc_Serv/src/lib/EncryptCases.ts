//Class in charge of sending and receiving from the AP of Go.Data the cases and encrypt it 
import e, { Router, Request, Response, NextFunction, response } from "express";
import express from "express";
import * as http from 'typed-rest-client/HttpClient';
import { IHttpClientResponse, IHeaders } from "typed-rest-client/Interfaces";


import { ConfigurationData } from './config'
import * as CryptoJS from 'crypto-js'
import crypto from 'crypto'
import GodataLicenses from "../models/godataLicenses";
import User from "../models/user";
import * as bigintCryptoUtils from 'bigint-crypto-utils'
import { bigintToText, textToBigint } from "bigint-conversion";

import GoDataLicenses from "../models/godataLicenses";

const config: ConfigurationData = new ConfigurationData();
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
      let encryptionKey = crypto.randomFillSync(Buffer.alloc(8)).toString('hex');
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
            let encryptedField: String = this.encrypt(cases[i][sensitiveField], encryptionKey);
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
                let encryptedField: String = this.encrypt(fieldNeededEncryption, encryptionKey);
                /*console.log(encryptedField)*/
                cases[i][subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = "/ENC/" + creatorEmail + "/" + encryptedField
              }
          }
        }
      });

      if (fieldsModified != 0) {
        //We update only the cases where we have encrypted data
        //console.log("Returning save to Go.Data --> new Entry: " + cases[i])
        await this.updateCase(cases[i]);

        //We encrypt the key with the RSA Keys of Admin user and The Hospital
        let managerUser = new User(await User.findOne({ username: "admin" }));
        /*console.log("-------->>>>_--->>>--<-<>>><<>><>"+managerUser);*/
        let keyEncrypted = bigintCryptoUtils.modPow(textToBigint(encryptionKey), managerUser.get('pubKey.publicexp'), managerUser.get('pubKey.publicmod'));

        //Hospital, if the hospital does not exist in our DB we only save the keys of the admin

        let hospUser = new User(await User.findOne({ username: creatorEmail }));

       /* console.log("-------->>>>_--->>>--<-<>>><<>><>"+hospUser.get('username'));*/
        let keys;
        //If this condition is not fulfilled that means that does not exist this username
        if (hospUser.get('username') == undefined) {
          //Does not exist the hospital just storing root info
          keys = [
            {
              hospitalName: "admin",
              usedKey: keyEncrypted
            }];
        }
        else {
          let keyEncryptedHospital: bigint = bigintCryptoUtils.modPow(textToBigint(encryptionKey), hospUser.get('pubKey.publicexp'), hospUser.get('pubKey.publicmod'))
          console.log(keyEncryptedHospital)
          keys = [
            {
              hospitalName: "admin",
              usedKey: keyEncrypted
            },
            {
              hospitalName: creatorEmail,
              usedKey: keyEncryptedHospital
            }
          ]
        }

        const newGoDataLicenseCase = new GodataLicenses({
          caseId: cases[i]['id'],
          creatorEmail: creatorEmail,
          keys:keys }); //New entry in our DRM server to store the keys
        /*console.log("STEP7 --> new Entry: " + newGoDataLicenseCase)*/
        newGoDataLicenseCase.save().then((data) => {
          return res.status(201).send({ message: "Encrypted" });

        }).catch((err) => {
          console.log(err)
          return res.status(500).json({ message: err });
        })
        fieldsModified = 0 //Reset
      }
    }
  }


  //Function where the user pass the id of a case and return the case decrypted
  public async decryptCase(req: Request, res: Response) {

    let spCase = await this.getSpecificCase(req.body.ID);
    //Once we have the case we need to check to get the key to decrypt that is encrypted with pubkey of Hosp

    //Once we have the hash we need to find the key for the case that is already stored in the client with the getKey

    //Just for test we put the key already decrypted
    let managerUser = await User.findOne({ username: "admin"});
   /* let userUser = new User(await User.findOne({ username: "admin" }));*/
    let goDataId = await GoDataLicenses.findOne({ caseId: req.body.ID});
    // @ts-ignore
    /*let privateKeyOfUSer: bigint = bigintCryptoUtils.modPow(userUser.get('privKey.privateexp'), managerUser.get('privKey.privateexp'), managerUser.get('pubKey.publicmod'))
    // @ts-ignore
    let symmetricKey: bigint = bigintCryptoUtils.modPow(goDataId.keys[0].usedKey, privateKeyOfUSer, userUser.get('pubKey.publicmod'))*/
    /*console.log(bigintToText(symmetricKey)) *///Works --> Symmetric Key obtained decrypting first the privatekey of user
    // @ts-ignore
    //let keyEncrypted = bigintCryptoUtils.modPow(textToBigint(encryptionKey), managerUser.get('pubKey.publicexp'), managerUser.get('pubKey.publicmod'));
    let result2 = bigintCryptoUtils.modInv(goDataId.keys[0].usedKey,managerUser.get('privKey.publicmod'));
    let res2 = bigintToText(result2);
    console.log(result2);
    //b,e,n  --Inv-> a,n(private_modulo)
    let key: string = "191606092ca12f97";
    //key ="191606092ca12f97"; What the decryption should look like!
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
          let decryptedField: String = this.decrypt(encryptedFieldValue, key);
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
              let decryptedField: String = this.decrypt(encryptedFieldValue, key);
              spCase[subSensitiveField[0]][subSensitiveFields][subSensitiveField[1]] = decryptedField;
          }
        }
      }
    });
    res.status(200).send(spCase);
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
  private async updateCase(element: any): Promise<any> {
    //Update the case
    let token: String = await this.auth();
    const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${element.id}?access_token=${token}`;
    const body = element;
    try {
      await this.doPut(url, body)
    }
    catch {
      return 1;
    }
    return 0;


  }
  private encrypt(element: any, key: string): String {

    let encrypted = CryptoJS.AES.encrypt(element, key).toString();
    return encrypted;
  }
  private decrypt(element: any, key: string): String {
    let decrypted = CryptoJS.AES.decrypt(element, key).toString(CryptoJS.enc.Utf8);
    console.log("DECRYPTED Value-->" + decrypted)
    return decrypted;
  }

  private async getEmailCreator(idCreator: string) {
    //Here we search the email of the creator of the case to then save in our DB
    let id: string = idCreator;//req.params.hashCase;
    let token: string = await this.auth();
    const url: string = `${config.URL}/users/${id}?access_token=${token}`;
    let res = await this.doGet(url);
    let user = JSON.parse(res);
    return user.email;

  }


  public async doGet(url: string): Promise<string> {
    const client = new http.HttpClient(config.USER_AGENT);
    let response: IHttpClientResponse;

    const headers: IHeaders = {
      "Accept": "application/json",
      "Content-Type": 'application/json; charset=utf-8'
    };

    console.log(`URL: ${url}`);
    try {
      response = await client.get(url, headers);
    } catch (e) {
      console.error(`ERROR: ${e}`);
      response = e;
    }

    const result = await response.readBody();
    const statusCode = response.message.statusCode;
    console.log("STATUS CODE " + statusCode)
    /*console.log(`RESULT: ${result}`);*/
    return result;
  }


  private async doPost(url: string, body: any): Promise<string> {
    const client = new http.HttpClient(config.USER_AGENT);
    let response: IHttpClientResponse;

    const headers: IHeaders = {
      "Accept": "application/json",
      "Content-Type": 'application/json; charset=utf-8'
    };
    const data = JSON.stringify(body);
    console.log(`URL: ${url}`);
    /*console.log(`BODY: ${data}`);*/
    try {
      response = await client.post(url, data, headers);
    } catch (e) {
      console.error(`ERROR: ${e}`);
      response = e;
    }

    const result = await response.readBody();
    /*console.log(`RESULT: ${result}`);*/
    return result;
  }

  private async doPut(url: string, body: any): Promise<string> {
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
    try {
      response = await client.put(url, data, headers);
    } catch (e) {
      console.error(`ERROR: ${e}`);
      response = e;
    }

    const result = await response.readBody();
    /*console.log(`RESULT: ${result}`);*/
    return result;
  }



  public async auth(): Promise<string> {
    const url = `${config.URL}/users/login`;
    const body = {
      email: config.USER,
      password: config.PASSWORD
    }

    const result = await this.doPost(url, body);
    const json = JSON.parse(result);
    return json.id;
  }

}