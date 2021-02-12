import crypto from "crypto";
import config from "../configurations/config";
import * as http from "typed-rest-client/HttpClient";
import {IHeaders, IHttpClientResponse} from "typed-rest-client/Interfaces";

function getCase(caseId:string): Promise<any>{
    return new Promise((resolve,reject )=> {
        //First we get the token then get the cases
        auth().then((token)=>{
            const url: string = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`;
            doGet(url).then((response)=>{
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
            doGet(url).then((response: string)=>{
                return resolve(JSON.parse(response));
            }).catch((err)=>{
                return reject(err);
            })
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
            doPut(url, body).then((_)=>{
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

function getInstituteCreator(idCreator: string):Promise<string>{
    return new Promise((resolve,reject )=> {
        //Here we search the email of the creator of the case to then save in our DB
        let id: string = idCreator;//req.params.hashCase;
        auth().then((token)=>{
            const url: string = `${config.URL}/users/${id}?access_token=${token}`;
            doGet(url).then((res)=>{
                let user = JSON.parse(res);
                let institute = user.institutionName.split("_");
                let nameInstitute = institute.splice(6,institute.length-1).join('');
                return resolve(nameInstitute);
            }).catch((err)=>{
                return reject(err);
            })
        }).catch((err)=>{
            return reject(err);
        });
    });
}


function doGet(url: string):Promise<string>{
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

function doPost(url: string, body: any):Promise<string>{
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

function doPut(url: string, body: any){
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

function auth():Promise<string>{
    return new Promise((resolve,reject )=> {
        const url = `${config.URL}/users/login`;
        const body = {
            email: config.USER,
            password: config.PASSWORD
        }

        doPost(url, body).then((result)=>{
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
    getInstituteCreator,
    updateCase,
    getCase
}