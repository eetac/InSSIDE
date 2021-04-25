import mongoose, { Document, Schema } from 'mongoose';
//USERS OF THE DRM SERVER
const UserSchema: Schema = new Schema({

    hospital: {
        type: String,
        required: true,
        unique:true
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
        type: String
    }
});
//Interface for the User Document
export interface IUser extends Document {
    hospital: string;
    password: string;
    publicKey: string;
    privateKey: string;
}
export default mongoose.model<IUser>('User', UserSchema,'users');
/*
export default model('User', UserSchema);*/
