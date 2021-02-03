import {Schema, model} from 'mongoose'

//USERS OF THE DRM SERVER
const GoDataIdentitySchema: Schema = new Schema({

    hash: { type: String, required: true}, //Of the user calculated in Go.Data
    creatorEmail:{type: String, required: true}, //To avoid problems with two cases that are equal from different  
    keys: [{
        hospitalName: { type: String, required: true},
            usedKey : { type: String, required: true}
            
    }]
    

});


export default model('GoDataIdentity', GoDataIdentitySchema);