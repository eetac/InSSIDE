/*import goDataHelper from "../helpers/goDataHelper";*/
import anonymizationHelper from "../lib/anonymization.class";
import httpHelper from "../helpers/httpHelper";
const config = require('../configurations/config');
/*import config2 from "../configurations/config";*/
/**
 * Encrypts the cases every "x" seconds given in ./src/configurations/config.ts
 */
function timerEncrypt() {
    // setTimeout to re-execute the main logic on a timer, there also exist
    // setInterval which is tempting but risk starting a run before the prior run completes
    const body = {
        email: config.USER,
        password: config.PASSWORD
    }
    let uri = `${config.URL}/users/login`;
    httpHelper.doPost(uri, body).then((result)=>{
        const res = JSON.parse(result);
        const token = res.id;
        const url: string = `${config.URL}/outbreaks/${config.OUTBREAK_ID}/cases?access_token=${token}`;
        httpHelper.doGet(url).then((response: string)=>{
           let cases = JSON.parse(response);
            anonymizationHelper.encryptCases(cases).then(()=>{
                console.log(`Auto Encryption ran successfully, next auto encryption in: ${config.autoEncryptSeconds}`);
                setTimeout(timerEncrypt, config.autoEncryptSeconds*1000);
                console.log(`Next auto encryption in: ${config.autoEncryptSeconds}`);
            }).catch((erroneousResult:any)=>{
                console.log(`Error while auto encrypting cases :: ${erroneousResult}`);
                setTimeout(timerEncrypt, config.autoEncryptSeconds*1000);
                console.log(`Next auto encryption in: ${config.autoEncryptSeconds}`);
            });
        }).catch((err:any)=>{
            console.log(err);
        });
    }).catch((err)=>{
        console.log("Error doing a post inside authentication: "+err);
    });

    // Work in progress
    /*goDataHelper.getCases().then((cases:any)=>{*/

    /*}).catch((err:any)=>{
        console.log(`Error while getting cases for auto encryption :: ${err}`);
        setTimeout(timerEncrypt, config2.autoEncryptSeconds*1000);
        console.log(`Next auto encryption in: ${config2.autoEncryptSeconds}`);
    })*/
}
export default {
    timerEncrypt
}