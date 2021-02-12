import Mongoose, {ConnectionOptions, Document, Schema} from 'mongoose';
import config from "../configurations/config";
const mongoose = require('mongoose');
//USERS OF THE DRM SERVER

const UserSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique:true
    },
    contactInfo: {
        type:String,
        required:true
    },
    password: {
        type:String,
        required:true
    },
    publicKey: {
        type: String,
        required:true
    },
    privateKey:{
        type: String,
        required:true
    }
});
//Interface for the User Document
export interface IUser extends Document {
    username: string;
    contactInfo: string;
    password: string;
    publicKey: string;
    privateKey: string;
}
const dbOptions: ConnectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
const conn = mongoose.createConnection(config.DB.URI,dbOptions);
conn.model('User', UserSchema,'users');
module.exports = conn.collections.users;
/*export default mongoose.model<IUser>('User', UserSchema,'users');*/
/*
export default model('User', UserSchema);*/
