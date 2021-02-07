import mongoose, { Document, Schema } from 'mongoose';
//USERS OF THE DRM SERVER
const UserSchema: Schema = new Schema({

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
export default mongoose.model<IUser>('User', UserSchema,'users');
/*
export default model('User', UserSchema);*/
