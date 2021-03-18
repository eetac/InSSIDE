"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*import goDataHelper from "../helpers/goDataHelper";*/
const anonymization_class_1 = __importDefault(require("../lib/anonymization.class"));
const httpHelper_1 = __importDefault(require("../helpers/httpHelper"));
const mongoose_1 = __importDefault(require("mongoose"));
const configWorker = require('../configurations/config');
/*import config2 from "../configurations/config";*/
/**
 * Encrypts the cases every "x" seconds given in ./src/configurations/config.ts
 */
function timerEncrypt() {
    // setTimeout to re-execute the main logic on a timer, there also exist
    // setInterval which is tempting but risk starting a run before the prior run completes
    const body = {
        email: configWorker.USER,
        password: configWorker.PASSWORD
    };
    let uri = `${configWorker.URL}/users/login`;
    httpHelper_1.default.doPost(uri, body).then((result) => {
        const res = JSON.parse(result);
        const token = res.id;
        const url = `${configWorker.URL}/outbreaks/${configWorker.OUTBREAK_ID}/cases?access_token=${token}`;
        httpHelper_1.default.doGet(url).then((response) => {
            let cases = JSON.parse(response);
            console.log("Gonna run encryption...");
            anonymization_class_1.default.encryptCases(cases).then((res) => {
                console.log(`Auto Encryption ran successfully, next auto encryption in: ${configWorker.AUTOENCRYPTIONTIMER}`);
                /*process.send(`Next auto encryption in: ${configWorker.autoEncryptSeconds}`);*/
                setTimeout(timerEncrypt, configWorker.AUTOENCRYPTIONTIMER * 1000);
            }).catch((erroneousResult) => {
                console.log(`Error while auto encrypting cases :: ${erroneousResult}`);
                console.log(`Next auto encryption in: ${configWorker.AUTOENCRYPTIONTIMER}`);
                setTimeout(timerEncrypt, configWorker.AUTOENCRYPTIONTIMER * 1000);
            });
        }).catch((err) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("Error doing a post inside authentication: " + err);
        /*process.send("Error doing a post inside authentication: " + err);*/
    });
}
const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
mongoose_1.default.connect(configWorker.DB.URI, dbOptions).then(r => {
    console.log('Connection w/ DB Successful!');
    console.log("Running child process...");
    console.log(`Auto Encryption every: ${configWorker.AUTOENCRYPTIONTIMER} seconds`);
    /*process.send("Testing if runs even after 60seconds");*/
    timerEncrypt();
}).catch((err) => {
    //Already being handled in index.ts console.log('Connection Error w/DB');
    console.log("Connection Error w/ license DB, auto encrypt won't be ran!");
});
