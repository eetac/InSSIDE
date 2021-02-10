import mongoose, { Document, Schema } from 'mongoose';
//USERS OF THE DRM SERVER
const GoDataLicensesSchema: Schema = new Schema({

    caseId: { type: String, required: true}, // Unique CaseId, Of the case/user/patient from Go.Data
    cipHash: { type: String, required: true}, // CIP Hash of the case
    creatorEmail:{type: String, required: true}, //To avoid problems with two cases that are equal from different  
    keys: [{
        hospitalName: { type: String, required: true},
            usedKey : { type: String, required: true}

    }]
});
export interface key{
    hospitalName: string,
    usedKey : string
}
//Interface for the User Document
export interface IGoDataLicensesSchema extends Document {
    caseId: string;
    cipHash: string;
    creatorEmail: string;
    keys: Array<key>;
}
//Mongoose.model(name, [schema], [collectionName], [skipInit])
export default mongoose.model<IGoDataLicensesSchema>('GoDataLicense', GoDataLicensesSchema,'GoDataLicenses');
/*
export default model('GoDataLicenses', GoDataLicensesSchema);*/
