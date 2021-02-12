/*
import {Connection, connection} from "mongoose";
const mongoose = require('mongoose');
import config from "../configurations/config";
/!**===========================================================
 * ?  initiateDBConnection function connects to the database and resolves
 * *   if the connection was successful or rejects when it wasn't
 *============================================================**!/
const initiateDBConnection = mongoose.createConnection(config.DBGoData.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
    /!*return new Promise((resolve,reject )=>{
        try {
              /!*.then((connectionRes:Connection)=>{
                return resolve(connectionRes.db);
            }).catch((err: any)=>{
                console.log(err);
                return reject(err);
            });
        }catch (e) {
            console.log(e);
            return reject(e)
        }
    });*!/
export default { initiateDBConnection };*/
