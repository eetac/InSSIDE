import mongoose, { ConnectionOptions } from 'mongoose';
import User, { IUser } from "./models/user";
import config from "./configurations/config";
const bcrypt = require('bcrypt');
const crypto = require("crypto");

/**===========================================================
 * ?  initiateDB function connects to the database and resolves
 * *   if the connection was successful or rejects when it wasn't
 *============================================================**/
function initiateDB() {
    return new Promise((resolve,reject )=>{
        try {
            const dbOptions: ConnectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
            mongoose.connect(config.DB.URI, dbOptions).then(r =>{
                console.log('Connection w/ DB Successful!');
                resolve(true);
                return;
            }).catch((err)=>{
                //Already being handled in index.ts console.log('Connection Error w/DB');
                reject(new Error(err.message));
                return;
            });
        } catch  (error) {
            ////console.debug("Some error while setting LastActive on User", error);
            reject( new Error( error ) );
            return;
        }
    });
}
/**===========================================================
 * ?  createAdmin function checks if the admin exists, and if
 * *   the admin doesn't exist, a new admin with default
 * *   username=admin and password=admin is created
 *============================================================**/
function createAdmin():Promise<boolean>{
    return new Promise((resolve,reject )=>{
        try {
            let query = { "username": "admin" };
            User.findOne(query).then((res)=>{
                if(res==null){
                    // Admin not created in the DB
                    // Creating a new admin
                    const saltRounds = 10;
                    let password = bcrypt.hashSync("admin",saltRounds);

                    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa',
                        {   modulusLength: 4096,  // the length of your key in bits
                            publicKeyEncoding: {
                                type: 'spki',       // recommended to be 'spki' by the Node.js docs
                                format: 'pem'
                            },
                            privateKeyEncoding: {
                                type: 'pkcs8',      // recommended to be 'pkcs8' by the Node.js docs
                                format: 'pem',
                                //cipher: 'aes-256-cbc',   // *optional*
                                //passphrase: 'top secret' // *optional*
                            }
                        });
                    let managerUser:IUser = new User({
                        username :"admin",
                        contactInfo: "admin@admin.com",
                        password: password,
                        publicKey: publicKey,
                        privateKey: privateKey
                    });
                    managerUser.save().then((_) => {
                        console.log("admin created with username:admin & password:admin; Remember to change!");
                        resolve( true );return;
                    }).catch((err) => {
                        reject( new Error( err ) );
                        return;
                    });
                }else{
                    //No need to create admin,already exits!
                    console.log("Admin account already exists");
                    resolve( true );
                    return;
                }
            }).catch((err)=>{
                reject( new Error( err ) );
                return;
            });
        } catch (error) {
            ////Some Error while trying to execute promise
            reject( new Error( error ) );
            return;
        }
    });
}

export default { initiateDB,createAdmin };