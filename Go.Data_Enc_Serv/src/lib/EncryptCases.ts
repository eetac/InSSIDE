//Class in charge of sending and receiving from the AP of Go.Data the cases and encrypt it 
import e, { Router, Request, Response, NextFunction, response } from "express";
import express from "express";
import * as http from 'typed-rest-client/HttpClient';
import { IHttpClientResponse, IHeaders } from "typed-rest-client/Interfaces";


import { ConfigurationData } from './config'
import * as CryptoJS from 'crypto-js'
import crypto from 'crypto'
import godataIdentity from "../models/godataIdentity";
import User from "../models/userHosp";
import { PublicKey } from "./PublicKey";
import * as bigintCryptoUtils from 'bigint-crypto-utils'
import { bigintToText, textToBigint } from "bigint-conversion";
import { text } from "body-parser";

const config: ConfigurationData = new ConfigurationData();
export class EncryptCases {

  //Function that get from the API all the actual cases and 
  //encrypt the ones that are not encrypted yet
  public async encryptCases(req: Request, res: Response) {

    let cases = await this.getCases();

    //for all the cases we encrypt if is needed the sensible data
    let fieldsModified: Number = 0;
    for (let i = 0; i < cases.length; i++) {
      console.log("STEP0 --> CASE: " + cases[i])
      //First we need to know who have added this case to Go.Data and generate the hash of the case
      let creator = cases[i].createdBy;
      let creatorEmail = await this.getEmailCreator(cases[i].createdBy)
      console.log("STEP1 --> EMAIL CREATOR: " + creatorEmail)
      let encryptionKey = crypto.randomFillSync(Buffer.alloc(8)).toString('hex');
      console.log("STEP2 --> ENCRYPTION KEY: " + encryptionKey)
      let positionCIP = 0; // To then update

      while (cases[i]["documents"][positionCIP]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP") {
        positionCIP = positionCIP + 1;
      }

      let fullFieldsToHash = cases[i]["documents"][positionCIP]["number"].toUpperCase();
      let hash = this.caseHash(fullFieldsToHash);

      //Now for each field sensitive it is encrypted
      config.sensitiveData.forEach(element => {

        let isDocument = element.split(",").length; //If there is a document like  address,phoneNumber
        // console.log(isDocument)

        if (isDocument == 1) { //We don't need to split because is not a doc

          //If the beggining of the value is different of /ENC (so it has not been encrypted yet) we encrypt the field and add /ENC/creatorEmail at the beggining
          // console.log("###################")
          // console.log(cases[i][element].substring(0, 5))
          // console.log("###################")
          if (cases[i][element].substring(0, 5) != "/ENC/") {
            fieldsModified = 1; //SetModified
            let encryptedField: String = this.encrypt(cases[i][element], encryptionKey);
            console.log(encryptedField)
            cases[i][element] = "/ENC/" + creatorEmail + "/" + encryptedField
          }
        }
        else { //is a document

          // console.log("########ELSE######")
          // console.log(cases[i][element.split(",")[0]][0][element.split(",")[1]])
          // console.log("###################")
          if (cases[i][element.split(",")[0]][0][element.split(",")[1]].substring(0, 5) != "/ENC/") { //if is not encrypted
            fieldsModified = 1; //SetModified
            let encryptedField: String = this.encrypt(cases[i][element.split(",")[0]][0][element.split(",")[1]], encryptionKey);
            console.log(encryptedField)
            cases[i][element.split(",")[0]][0][element.split(",")[1]] = "/ENC/" + creatorEmail + "/" + encryptedField
          }
        }
      });

      if (fieldsModified != 0) {
        //We update only the cases where we have encrypted data

        //Finnaly for all the cases we encrypt the CIP and add the hash field
        let encryptedField: String = this.encrypt(cases[i]["documents"][positionCIP]["number"], encryptionKey);
        console.log(encryptedField)
        cases[i]["documents"][positionCIP]["number"] = "/ENC/" + creatorEmail + "/" + encryptedField;

        //Add the Hash
        cases[i]["documents"][cases[i]["documents"].length] = {
          "type": "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_OTHER",
          "number": hash
        }

        console.log("Returning save to Go.Data --> new Entry: " + cases[i])

        await this.updateCase(cases[i]);

        //We encrypt the key with the RSA Keys of Admin user and The Hospital
        let managerUser = new User(await User.findOne({ username: "admin" }));
        console.log("-------->>>>_--->>>--<-<>>><<>><>"+managerUser);
        let keyEncrypted = bigintCryptoUtils.modPow(textToBigint(encryptionKey), managerUser.get('pubKey.publicexp'), managerUser.get('pubKey.publicmod'));

        //Hospital, if the hospital does not exist in our DB we only save the keys of the admin

        let hospUser = new User(await User.findOne({ username: creatorEmail }));

        console.log("-------->>>>_--->>>--<-<>>><<>><>"+hospUser.get('username'));
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
          let keyEncryptedhosp: bigint = bigintCryptoUtils.modPow(textToBigint(encryptionKey), hospUser.get('pubKey.publicexp'), hospUser.get('pubKey.publicmod'))
          console.log(keyEncryptedhosp)
          keys = [
            {
              hospitalName: "admin",
              usedKey: keyEncrypted
            },
            {
              hospitalName: creatorEmail,
              usedKey: keyEncryptedhosp
            }
          ]
        }

        const newEntry = new godataIdentity({ hash,creatorEmail, keys }); //New entry in our DRM server to store the keys
        console.log("STEP7 --> new Entry: " + newEntry)
        newEntry.save().then((data) => {
          res.status(201).send({ message: "Encrypted" });
        }).catch((err) => {
          console.log(err)
          res.status(500).json({ message: err });
        })
        fieldsModified = 0 //Reset
      }
    }
  }


  //Function where the user pass the id of a case and return the case decrypted
  public async decryptCase(req: Request, res: Response) {

    let spCase = await this.getSpecificCase(req.body.ID);
    let positionHash: number = 0;
    //Once we have the case we need to check the get the key to decrypt that is encrypted with pubkey of Hosp
    // while (spCase["documents"][positionHash]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_OTHER") {
    //   positionHash = positionHash + 1;
    // }
    // let hash :string = spCase["documents"][positionHash]["number"];
    // let keysCase = new godataIdentity(await godataIdentity.findOne({ hash: hash }));

    //Once we have the hash we need to find the key for the case that is already stored in the client with the getKey

    //Just for test we put the key already decrypted 

    let key: string = "a16ffd29e64fa048"

    config.sensitiveData.forEach(element => {
      var isDocument = element.split(",").length; //If there is a document we have address,phoneNumber
      if (isDocument == 1) {
        //If the beggining of the value is equal to /ENC/ we decrypt the field 
        if (spCase[element].substring(0, 5) == "/ENC/") {
          let valueToDecrypt = spCase[element].substring(42,)//from 42 because after /ENC/ we have the id of the creator
          let decryptedField: String = this.decrypt(valueToDecrypt, key);
          spCase[element] = decryptedField
        }
      }
      else {
        if (spCase[element.split(",")[0]][0][element.split(",")[1]].substring(0, 5) == "/ENC/") {
          let valueToDecrypt = spCase[element.split(",")[0]][0][element.split(",")[1]].substring(42,)
          let decryptedField: String = this.decrypt(valueToDecrypt, key);
          spCase[element.split(",")[0]][0][element.split(",")[1]] = decryptedField
        }
      }
    });
     //Finally decrypt CIP
     let positionCIP: number = 0;
     while (spCase["documents"][positionCIP]["type"] != "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_CIP") {
       positionCIP = positionCIP + 1;
     }
     let CIPToDecrypt = spCase["documents"][positionCIP]["number"].substring(42,)
     console.log("CIP--"+CIPToDecrypt)
     let decryptedField: String = this.decrypt(CIPToDecrypt, key);
     spCase["documents"][positionCIP]["number"] = decryptedField
     //And we have the case decrypted
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

    var encrypted = CryptoJS.AES.encrypt(element, key).toString();
    return encrypted;
  }
  private decrypt(element: any, key: string): String {
    var decrypted = CryptoJS.AES.decrypt(element, key).toString(CryptoJS.enc.Utf8);
    console.log("DEEEEECRYPTED-->" + decrypted)
    return decrypted;
  }
  private caseHash(toHash: string) {
    let caseHash = CryptoJS.SHA256(toHash).toString(CryptoJS.enc.Hex)
    return caseHash;
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
    console.log(`RESULT: ${result}`);
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
    console.log(`BODY: ${data}`);
    try {
      response = await client.post(url, data, headers);
    } catch (e) {
      console.error(`ERROR: ${e}`);
      response = e;
    }

    const result = await response.readBody();
    console.log(`RESULT: ${result}`);
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
    console.log(`BODY: ${data}`);
    try {
      response = await client.put(url, data, headers);
    } catch (e) {
      console.error(`ERROR: ${e}`);
      response = e;
    }

    const result = await response.readBody();
    console.log(`RESULT: ${result}`);
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