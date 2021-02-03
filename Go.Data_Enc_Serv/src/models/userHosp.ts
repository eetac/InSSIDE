import {Schema, model} from 'mongoose'

//USERS OF THE DRM SERVER
const UserSchema: Schema = new Schema({

    username: { type: String, required: true, unique:true},
    contactInfo: {type:String,required:true},
    password: {type:String,required:true},
    pubKey: {
        publicexp:{type:String, required:false},
        publicmod:{type:String, required:false}

    },
    privKey:{
        privateexp:{type:String, required:false},//Encrypted with the system pubKey to have recovery option
        publicmod:{type:String, required:false}
    } 

});


export default model('User', UserSchema);