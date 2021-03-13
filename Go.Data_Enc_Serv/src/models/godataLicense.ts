import mongoose, { Document, Schema } from 'mongoose';
//USERS OF THE DRM SERVER
const GoDataLicensesSchema: Schema = new Schema({

    caseId: { type: String, required: true}, // Unique CaseId, Of the case/user/patient from Go.Data
    hashId: { type: String, required: true}, // CIP Hash of the case
    creatorEmail:{type: String, required: true}, //To avoid problems with two cases that are equal from different  
    keys: [{
        institutionName: { type: String, required: true},
            usedKey : { type: String, required: true},
            userGoDataId  : {type:String, required:true},
            email   : {type:String, required:true}
    }]
});
export interface key{
    institutionName: string,
    usedKey : string,
    userGoDataId:string,
    email:string
}
//Interface for the User Document
export interface IGoDataLicensesSchema extends Document {
    caseId: string;
    hashId: string;
    creatorEmail: string;
    keys: Array<key>;
}
//Mongoose.model(name, [schema], [collectionName], [skipInit])
export default mongoose.model<IGoDataLicensesSchema>('GoDataLicense', GoDataLicensesSchema,'GoDataLicenses');
/*
export default model('GoDataLicenses', GoDataLicensesSchema);*/
