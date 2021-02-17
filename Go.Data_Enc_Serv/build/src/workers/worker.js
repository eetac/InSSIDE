"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const goDataHelper_1 = __importDefault(require("../helpers/goDataHelper"));
const anonymization_class_1 = __importDefault(require("../lib/anonymization.class"));
const config_1 = __importDefault(require("../configurations/config"));
/**
 * Encrypts the cases every "x" seconds given in ./src/configurations/config.ts
 */
function timerEncrypt() {
    // setTimeout to re-execute the main logic on a timer, there also exist
    // setInterval which is tempting but risk starting a run before the prior run completes
    goDataHelper_1.default.getCases().then((cases) => {
        anonymization_class_1.default.encryptCases(cases).then((result) => {
            console.log(`Auto Encryption ran successfully, next auto encryption in: ${config_1.default.autoEncryptSeconds}`);
            setTimeout(timerEncrypt, config_1.default.autoEncryptSeconds * 1000);
            console.log(`Next auto encryption in: ${config_1.default.autoEncryptSeconds}`);
        }).catch((erroneousResult) => {
            console.log(`Error while auto encrypting cases :: ${erroneousResult}`);
            setTimeout(timerEncrypt, config_1.default.autoEncryptSeconds * 1000);
            console.log(`Next auto encryption in: ${config_1.default.autoEncryptSeconds}`);
        });
    }).catch((err) => {
        console.log(`Error while getting cases for auto encryption :: ${err}`);
        setTimeout(timerEncrypt, config_1.default.autoEncryptSeconds * 1000);
        console.log(`Next auto encryption in: ${config_1.default.autoEncryptSeconds}`);
    });
}
module.exports = timerEncrypt();
