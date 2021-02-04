import mongoose, { model } from 'mongoose';
import User from './models/userHosp';
import { RSA } from './lib/RSA';
import * as CryptoJS from 'crypto-js'
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
/**===========================================================
 * ?  initiateDB function connects to the database and resolves
 * *   if the connection was successful or rejects when it wasn't
 *============================================================**/
function initiateDB() {	
    return new Promise((resolve,reject )=>{
        try {
        mongoose.connect('mongodb://localhost/DRM', (error) => {
            if (!error) {
                console.log('Connection w/ DB Succesful!');
                resolve( true );
                return;
            }
            else {
                console.log('Connection Error w/DB');
                reject( new Error( error.message ) );
                return;
            }
        })
        } catch (error) {
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
            var query = { "username": "admin" };
            User.findOne(query).then((res)=>{
                if(res==null){
                    // Admin not created in the DB
                    // Creating a new admin
                    RSA.generateKeys().then((keys)=>{
                        if(keys!=null){
                            //Parsing everything
                            let pubKey = {
                                publicexp: keys.pubKey.e,
                                publicmod: keys.pubKey.n
                            };
                            let privKey = {
                                privateexp: keys.privKey.d,
                                publicmod: keys.privKey.n
                            };
                            let password = CryptoJS.SHA256("admin").toString();
                            let managerUser = new User({
                                "username" :"admin",
                                "contactInfo": "admin@admin.com",
                                "password": password,
                                "pubKey": pubKey,
                                "privKey": privKey 
                            });
                            //We need to has the password 
                            
                            managerUser.save().then((data) => {
                                console.log("admin created with username:admin & password:admin; Remember to change!");
                                resolve( true );
                                return;
                            }).catch((err) => {
                                reject( new Error( err ) );
                                return;
                            });
                        }else{
                            reject( new Error( "Null RSA Keys Generated!" ) );
                            return;
                        };
                    }).catch((err)=>{
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