import * as http from "typed-rest-client/HttpClient";
import {IHeaders, IHttpClientResponse} from "typed-rest-client/Interfaces";
const config = require('../configurations/config');

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
        /*let response: IHttpClientResponse;*/

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

export default {
    doGet,
    doPost,
    doPut
}