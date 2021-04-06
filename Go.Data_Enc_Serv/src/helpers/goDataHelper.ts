import crypto from "crypto";
const config = require('../configurations/config');
import httpHelper from "./httpHelper";

function getCase(caseId:string): Promise<any>{
    return new Promise((resolve,reject )=> {
        //First we get the token then get the cases
        auth().then((token)=>{
            const url: string = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`;
            httpHelper.doGet(url).then((response)=>{
                return resolve(JSON.parse(response));
            }).catch((err)=>{
                return reject(err);
            })
        }).catch((err)=>{
            return reject(err);
        });
    });
}

function getCases(): Promise<any> {
    return new Promise((resolve,reject )=> {
        //First we get the token then get the cases
        auth().then((token: string)=>{
            const url: string = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases?access_token=${token}`;
            httpHelper.doGet(url).then((response: string)=>{
                return resolve(JSON.parse(response));
            }).catch((err:any)=>{
                return reject(err);
            });
        }).catch((err)=>{
            return reject(err);
        });
    });
}

function updateCase(body: any){
    return new Promise((resolve,reject )=> {
        //Update the case
        auth().then((token)=>{
            const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${body.id}?access_token=${token}`;
            httpHelper.doPut(url, body).then((_)=>{
                resolve(true);
            }).catch((err:any)=>{
                console.log("Error while updating Case to goData: "+err);
                return reject(err);
            })
        }).catch((err)=>{
            return reject(err);
        });
    });
}

function getInstituteCreator(idCreator: string):Promise<any>{
    return new Promise((resolve,reject )=> {
        //Here we search the email of the creator of the case to then save in our DB
        let id: string = idCreator;//req.params.hashCase;
        auth().then((token)=>{
            const url: string = `${config.URL}/users/${id}?access_token=${token}`;
            
            httpHelper.doGet(url).then((res)=>{
                let user = JSON.parse(res);
                let institute = user.institutionName.split("_");
                let nameInstitute = institute.splice(6,institute.length-1).join('');
                const hospitalName = user.email.split('@')[1].split('.')[0];
                let createdBy = {
                    creatorInstitute    :   nameInstitute,
                    email               :   user.email,
                    hospitalName        :   hospitalName
                };
                return resolve(createdBy);
            }).catch((err:any)=>{
                return reject(err);
            })
        }).catch((err)=>{
            return reject(err);
        });
    });
}
/* "id": "83704f2c-2e24-449f-b510-466e20bf5118",
"firstName": "User",
"lastName": "1",
"roleIds": [
  "ROLE_CONTACT_OF_CONTACT_MANAGER",
  "ROLE_CONTACT_TRACER",
  "ROLE_CONTACT_TRACING_COORDINATOR",
  "ROLE_REPORTS_AND_DATA_VIEWER",
  "ROLE_EPIDEMIOLOGIST",
  "ROLE_GO_DATA_ADMINISTRATOR"
],
"activeOutbreakId": "12b593e4-6de2-4cbd-a4be-464f55bf57e0",
"languageId": "english_us",
"passwordChange": false,
"institutionName": "LNG_REFERENCE_DATA_CATEGORY_INSTITUTION_NAME_SALUT",
"telephoneNumbers": {
  "LNG_USER_FIELD_LABEL_PRIMARY_TELEPHONE": "admin@who.int"
},
"loginRetriesCount": 0,
"lastLoginDate": null,
"disregardGeographicRestrictions": false,
"dontCacheFilters": false,
"email": "user1@santjoan.com",
"createdAt": "2021-04-06T09:52:56.920Z",
"createdBy": "sys_admin",
"updatedAt": "2021-04-06T21:40:34.891Z",
"updatedBy": "system",
"deleted": false,
"createdOn": "API", */
function getGoDataUserId(email:string,password:string):Promise<string>{
    return new Promise((resolve,reject )=> {
        // Step1. Authenticate GoData with email & password
            const body = {
                email: email,
                password: password
            }
        const url = `${config.URL}/users/login`;

        httpHelper.doPost(url, body).then((result)=>{
            const json = JSON.parse(result);
            if(json.error==null){
                return resolve(json.userId);
            }else{
                return reject(`{"message":"User doesn't exist in go data server"}`);
            }
        }).catch((err)=>{
            console.log("Error doing a post inside authentication: "+err);
            return reject(err);
        });

    });
}


function auth():Promise<string>{
    return new Promise((resolve,reject )=> {
        const url = `${config.URL}/users/login`;
        const body = {
            email: config.USER,
            password: config.PASSWORD
        }

        httpHelper.doPost(url, body).then((result)=>{
            const json = JSON.parse(result);

            return resolve(json.id);
        }).catch((err)=>{
            console.log("Error doing a post inside authentication: "+err);

            return reject(err);
        });
    });
}

export default {
    getCases,
    updateCase,
    getInstituteCreator,
    getGoDataUserId,
    getCase
}