"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../configurations/config"));
const http = __importStar(require("typed-rest-client/HttpClient"));
function getCase(caseId) {
    return new Promise((resolve, reject) => {
        //First we get the token then get the cases
        auth().then((token) => {
            const url = `${config_1.default.URL}/outbreaks/${config_1.default.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`;
            doGet(url).then((response) => {
                return resolve(JSON.parse(response));
            }).catch((err) => {
                return reject(err);
            });
        }).catch((err) => {
            return reject(err);
        });
    });
}
function getCases() {
    return new Promise((resolve, reject) => {
        //First we get the token then get the cases
        auth().then((token) => {
            const url = `${config_1.default.URL}/outbreaks/${config_1.default.OUTBREAK_ID}/cases?access_token=${token}`;
            doGet(url).then((response) => {
                return resolve(JSON.parse(response));
            }).catch((err) => {
                return reject(err);
            });
        }).catch((err) => {
            return reject(err);
        });
    });
}
function updateCase(body) {
    return new Promise((resolve, reject) => {
        //Update the case
        auth().then((token) => {
            const url = `${config_1.default.URL}/outbreaks/${config_1.default.OUTBREAK_ID}/cases/${body.id}?access_token=${token}`;
            doPut(url, body).then((_) => {
                resolve(true);
            }).catch((err) => {
                console.log("Error while updating Case to goData: " + err);
                return reject(err);
            });
        }).catch((err) => {
            return reject(err);
        });
    });
}
function getInstituteCreator(idCreator) {
    return new Promise((resolve, reject) => {
        //Here we search the email of the creator of the case to then save in our DB
        let id = idCreator; //req.params.hashCase;
        auth().then((token) => {
            const url = `${config_1.default.URL}/users/${id}?access_token=${token}`;
            doGet(url).then((res) => {
                let user = JSON.parse(res);
                let institute = user.institutionName.split("_");
                let nameInstitute = institute.splice(6, institute.length - 1).join('');
                return resolve(nameInstitute);
            }).catch((err) => {
                return reject(err);
            });
        }).catch((err) => {
            return reject(err);
        });
    });
}
function doGet(url) {
    return new Promise((resolve, reject) => {
        const client = new http.HttpClient(config_1.default.USER_AGENT);
        let response;
        const headers = {
            "Accept": "application/json",
            "Content-Type": 'application/json; charset=utf-8'
        };
        console.log(`URL: ${url}`);
        client.get(url, headers).then((response) => {
            //Response ok
            if (response != null) {
                response.readBody().then((result) => {
                    if (result != null) {
                        const statusCode = response.message.statusCode;
                        console.log("STATUS CODE " + statusCode);
                        /*console.log(`RESULT: ${result}`);*/
                        resolve(result);
                        return;
                    }
                    else {
                        reject(new Error("response on reading body was null, on post: " + url));
                        return;
                    }
                }).catch((err) => {
                    reject(err);
                    return;
                });
            }
            else {
                reject(new Error("response was null, on post" + url));
                return;
            }
        }).catch((err) => {
            console.log("HTTP Client Post Error: " + err);
            reject(err);
            return;
        });
    });
}
function doPost(url, body) {
    return new Promise((resolve, reject) => {
        const client = new http.HttpClient(config_1.default.USER_AGENT);
        let response;
        const headers = {
            "Accept": "application/json",
            "Content-Type": 'application/json; charset=utf-8'
        };
        const data = JSON.stringify(body);
        client.post(url, data, headers).then((response) => {
            //Response ok
            if (response != null) {
                response.readBody().then((result) => {
                    if (result != null) {
                        resolve(result);
                        return;
                    }
                    else {
                        reject(new Error("response on reading body was null, on post: " + url));
                        return;
                    }
                }).catch((err) => {
                    reject(err);
                    return;
                });
            }
            else {
                reject(new Error("response was null, on post" + url));
                return;
            }
        }).catch((err) => {
            console.log("HTTP Client Post Error: " + err);
            reject(err);
            return;
        });
    });
}
function doPut(url, body) {
    return new Promise((resolve, reject) => {
        //Para realizar peticiones HTTP PUT a Go.Data
        const client = new http.HttpClient(config_1.default.USER_AGENT);
        let response;
        const headers = {
            "Accept": "application/json",
            "Content-Type": 'application/json; charset=utf-8'
        };
        const data = JSON.stringify(body);
        console.log(`URL: ${url}`);
        /*console.log(`BODY: ${data}`);*/
        client.put(url, data, headers).then((response) => {
            //Response ok
            if (response != null) {
                response.readBody().then((result) => {
                    if (result != null) {
                        resolve(result);
                        return;
                    }
                    else {
                        reject(new Error("response on reading body was null, on post: " + url));
                        return;
                    }
                }).catch((err) => {
                    reject(err);
                    return;
                });
            }
            else {
                reject(new Error("response was null, on post" + url));
                return;
            }
        }).catch((err) => {
            console.log("HTTP Client Post Error: " + err);
            reject(err);
            return;
        });
    });
}
function auth() {
    return new Promise((resolve, reject) => {
        const url = `${config_1.default.URL}/users/login`;
        const body = {
            email: config_1.default.USER,
            password: config_1.default.PASSWORD
        };
        doPost(url, body).then((result) => {
            const json = JSON.parse(result);
            return resolve(json.id);
        }).catch((err) => {
            console.log("Error doing a post inside authentication: " + err);
            return reject(err);
        });
    });
}
exports.default = {
    getCases,
    getInstituteCreator,
    updateCase,
    getCase
};
