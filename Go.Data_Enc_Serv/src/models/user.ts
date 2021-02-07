import {Schema, model} from 'mongoose'

//USERS OF THE DRM SERVER
const UserSchema: Schema = new Schema({

    username: { type: String, required: true, unique:true},
    contactInfo: {type:String,required:true},
    password: {type:String,required:true},
    publicKey: {
        type: Buffer,
        String,required:true
    },
    privateKey:{
        type:Buffer,
        String,required:true
    } 

});


export default model('User', UserSchema);