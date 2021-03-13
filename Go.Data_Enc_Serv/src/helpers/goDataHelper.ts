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
                let createdBy = {
                    creatorInstitute    :   nameInstitute,
                    email               :   user.email
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