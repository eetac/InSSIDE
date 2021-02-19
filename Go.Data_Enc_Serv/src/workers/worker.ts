/*import goDataHelper from "../helpers/goDataHelper";*/
import anonymizationHelper from "../lib/anonymization.class";
import httpHelper from "../helpers/httpHelper";
import mongoose,{ConnectionOptions} from "mongoose";
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
    }
    let uri = `${configWorker.URL}/users/login`;
    httpHelper.doPost(uri, body).then((result) => {
        const res = JSON.parse(result);
        const token = res.id;
        const url: string = `${configWorker.URL}/outbreaks/${configWorker.OUTBREAK_ID}/cases?access_token=${token}`;
        httpHelper.doGet(url).then((response: string) => {
            let cases = JSON.parse(response);
            console.log("Gonna run encryption...");
            anonymizationHelper.encryptCases(cases).then((res) => {
                console.log(`Auto Encryption ran successfully, next auto encryption in: ${configWorker.autoEncryptSeconds}`);
                /*process.send(`Next auto encryption in: ${configWorker.autoEncryptSeconds}`);*/
                setTimeout(timerEncrypt, configWorker.autoEncryptSeconds * 1000);
            }).catch((erroneousResult: any) => {
                console.log(`Error while auto encrypting cases :: ${erroneousResult}`);
                console.log(`Next auto encryption in: ${configWorker.autoEncryptSeconds}`);
                setTimeout(timerEncrypt, configWorker.autoEncryptSeconds * 1000);
            });
        }).catch((err: any) => {
            console.log(err);
        });
    }).catch((err) => {
        console.log("Error doing a post inside authentication: " + err);
        /*process.send("Error doing a post inside authentication: " + err);*/
    });
}
const dbOptions: ConnectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
mongoose.connect(configWorker.DB.URI, dbOptions).then(r =>{
    console.log('Connection w/ DB Successful!')
    console.log("Running child process...");
    console.log(`Auto Encryption every: ${configWorker.autoEncryptSeconds} seconds`);
    /*process.send("Testing if runs even after 60seconds");*/
    timerEncrypt()
}).catch((err)=> {
    //Already being handled in index.ts console.log('Connection Error w/DB');
    console.log("Connection Error w/ DB, auto encrypt won't be ran!" )
});
