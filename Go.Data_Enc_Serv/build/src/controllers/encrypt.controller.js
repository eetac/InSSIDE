"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const goDataHelper_1 = __importDefault(require("../helpers/goDataHelper"));
const anonymization_class_1 = __importDefault(require("../lib/anonymization.class"));
/**
 * Encrypts all of the case, under admin
 * But remember to configure the config.ts properly
 * with the GoData username,password and the outbreak id
 * Examples:
 *    localhost:3000/encrypt
 */
const encryptCases = async (req, res) => {
    let cases = await goDataHelper_1.default.getCases();
    anonymization_class_1.default.encryptCases(cases).then((result) => {
        return res.status(result.statusCode).json({ message: result.message });
    }).catch((erroneousResult) => {
        return res.status(erroneousResult.statusCode).json({ error: { message: erroneousResult.message, status: erroneousResult.statusCode } });
    });
};
/**
 * Decrypts the case, given username(token:Future) and hashId
 * Examples:
 *
 *    {"hashId":"bla-bla-bla","username":"admin"}
 *
 */
/*const decryptCase: any = async (req: Request, res: Response)=> {
    anonymizationHelper.decryptCases(req.body.username,req.body.hashId).then((result)=>{
        return res.status(result.statusCode).json(result);
    }).catch((erroneousResult)=>{
        return res.status(erroneousResult.statusCode).json( erroneousResult );
    });
}*/
exports.default = { encryptCases };
