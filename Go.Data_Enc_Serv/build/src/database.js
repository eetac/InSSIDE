"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = __importDefault(require("./models/user"));
const config_1 = __importDefault(require("./configurations/config"));
const bcrypt = require('bcrypt');
const crypto = require("crypto");
/**===========================================================
 * ?  initiateDB function connects to the database and resolves
 * *   if the connection was successful or rejects when it wasn't
 *============================================================**/
function initiateDB() {
    return new Promise((resolve, reject) => {
        try {
            const dbOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            mongoose_1.default.connect(config_1.default.DB.URI, dbOptions).then(r => {
                console.log('Connection w/ DB Successful!');
                resolve(true);
                return;
            }).catch((err) => {
                //Already being handled in index.ts console.log('Connection Error w/DB');
                reject(new Error(err.message));
                return;
            });
        }
        catch (error) {
            ////console.debug("Some error while setting LastActive on User", error);
            reject(new Error(error));
            return;
        }
    });
}
/**===========================================================
 * ?  createAdmin function checks if the admin exists, and if
 * *   the admin doesn't exist, a new admin with default
 * *   username=admin and password=admin is created
 *============================================================**/
function createAdmin() {
    return new Promise((resolve, reject) => {
        try {
            let query = { "username": "admin" };
            user_1.default.findOne(query).then((res) => {
                if (res == null) {
                    // Admin not created in the DB
                    // Creating a new admin
                    const saltRounds = 10;
                    let password = bcrypt.hashSync("admin", saltRounds);
                    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 4096,
                        publicKeyEncoding: {
                            type: 'spki',
                            format: 'pem'
                        },
                        privateKeyEncoding: {
                            type: 'pkcs8',
                            format: 'pem',
                        }
                    });
                    let managerUser = new user_1.default({
                        username: "admin",
                        contactInfo: "admin@admin.com",
                        password: password,
                        publicKey: publicKey,
                        privateKey: privateKey
                    });
                    managerUser.save().then((_) => {
                        console.log("admin created with username:admin & password:admin; Remember to change!");
                        resolve(true);
                        return;
                    }).catch((err) => {
                        reject(new Error(err));
                        return;
                    });
                }
                else {
                    //No need to create admin,already exits!
                    console.log("Admin account already exists");
                    resolve(true);
                    return;
                }
            }).catch((err) => {
                reject(new Error(err));
                return;
            });
        }
        catch (error) {
            ////Some Error while trying to execute promise
            reject(new Error(error));
            return;
        }
    });
}
exports.default = { initiateDB, createAdmin };
