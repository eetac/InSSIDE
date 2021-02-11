import { Request, Response } from "express";
import goDataHelper from "../helpers/goDataHelper";
import anonymizationHelper from "../lib/anonymization.class"
/**
 * Encrypts all of the case, under admin
 * But remember to configure the config.ts properly
 * with the GoData username,password and the outbreak id
 * Examples:
 *    localhost:3000/encrypt
 */
const encryptCases: any = async (req: Request, res: Response)=>{

    let cases = await goDataHelper.getCases();
    anonymizationHelper.encryptCases(cases).then((result)=>{
        return res.status(result.statusCode).json({ message: result.message });
    }).catch((erroneousResult)=>{
        return res.status(erroneousResult.statusCode).json({ message: erroneousResult.message });
    });
}

/**
 * Decrypts the case, given username(token:Future) and caseId
 * Examples:
 *
 *    {"caseId":"bla-bla-bla","username":"admin"}
 *
 */
const decryptCase: any = async (req: Request, res: Response)=> {
    anonymizationHelper.decryptCases(req.body.username,req.body.caseId).then((result)=>{
        return res.status(result.statusCode).json({ message: result.message });
    }).catch((erroneousResult)=>{
        return res.status(erroneousResult.statusCode).json({ message: erroneousResult.message });
    });
}
export default {encryptCases,decryptCase};