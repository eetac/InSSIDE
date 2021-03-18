"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config = require('../configurations/config');
const httpHelper_1 = __importDefault(require("./httpHelper"));
function getCase(caseId) {
    return new Promise((resolve, reject) => {
        //First we get the token then get the cases
        auth().then((token) => {
            const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${caseId}?access_token=${token}`;
            httpHelper_1.default.doGet(url).then((response) => {
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
            const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases?access_token=${token}`;
            httpHelper_1.default.doGet(url).then((response) => {
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
            const url = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases/${body.id}?access_token=${token}`;
            httpHelper_1.default.doPut(url, body).then((_) => {
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
            const url = `${config.URL}/users/${id}?access_token=${token}`;
            httpHelper_1.default.doGet(url).then((res) => {
                let user = JSON.parse(res);
                let institute = user.institutionName.split("_");
                let nameInstitute = institute.splice(6, institute.length - 1).join('');
                let createdBy = {
                    creatorInstitute: nameInstitute,
                    email: user.email
                };
                return resolve(createdBy);
            }).catch((err) => {
                return reject(err);
            });
        }).catch((err) => {
            return reject(err);
        });
    });
}
function getGoDataUserId(email, password) {
    return new Promise((resolve, reject) => {
        // Step1. Authenticate GoData with email & password
        const body = {
            email: email,
            password: password
        };
        const url = `${config.URL}/users/login`;
        httpHelper_1.default.doPost(url, body).then((result) => {
            const json = JSON.parse(result);
            if (json.error == null) {
                return resolve(json.userId);
            }
            else {
                return reject(`{"message":"User doesn't exist in go data server"}`);
            }
        }).catch((err) => {
            console.log("Error doing a post inside authentication: " + err);
            return reject(err);
        });
    });
}
function auth() {
    return new Promise((resolve, reject) => {
        const url = `${config.URL}/users/login`;
        const body = {
            email: config.USER,
            password: config.PASSWORD
        };
        httpHelper_1.default.doPost(url, body).then((result) => {
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
    updateCase,
    getInstituteCreator,
    getGoDataUserId,
    getCase
};
