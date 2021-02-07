import mongoose, { Document, Schema } from 'mongoose';
//USERS OF THE DRM SERVER
const GoDataLicensesSchema: Schema = new Schema({

    caseId: { type: String, required: true}, //Of the user calculated in Go.Data
    creatorEmail:{type: String, required: true}, //To avoid problems with two cases that are equal from different  
    keys: [{
        hospitalName: { type: String, required: true},
            usedKey : { type: String, required: true}

    }]
});
export interface key{
    hospitalName: { type: String, required: true},
    usedKey : { type: String, required: true}
}
//Interface for the User Document
export interface IGoDataLicensesSchema extends Document {
    caseId: string;
    creatorEmail: string;
    keys: Array<key>;
}
//Mongoose.model(name, [schema], [collectionName], [skipInit])
export default mongoose.model<IGoDataLicensesSchema>('GoDataLicense', GoDataLicensesSchema,'GoDataLicenses');
/*
export default model('GoDataLicenses', GoDataLicensesSchema);*/
