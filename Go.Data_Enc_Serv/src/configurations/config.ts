//Configuration File for Localhost server of GoData
interface IConfig {
    URL : string,
    IV_LENGTH : number,
    saltRounds : number,
    USER :string,
    PASSWORD : string,
    USER_AGENT : string,
    USERGODATAID:string,
    INSTITUTION:string,
    DOCUMENT_HASH:string,
    OUTBREAK_ID : string,
    SENSITIVEDATA : Array<string>,
    DB: {
        URI: string,
        USER: string,
        PASSWORD: string
    },
    AUTOENCRYPTIONTIMER: number
}
const config:IConfig = {
    URL             :   "http://localhost:8000/api", //Go Data URI
    IV_LENGTH       :   16, // Minimum Length 16 IV
    saltRounds      :   10, // Hash Function Rounds, recommended for security at least 10
    USER            :   "encryption@local.com",
    USERGODATAID    :   "4c876f8c-3bbc-4324-b153-3b0829078d9b",
    INSTITUTION     :   "SALUT GENCAT",
    PASSWORD        :   "kruskechi1234",
    DOCUMENT_HASH   :   "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID",
    USER_AGENT      :   "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID     :   "be359a7a-623e-46ac-ac18-420dc0db3a59",
    SENSITIVEDATA   :   ["firstName","middleName","lastName","documents,number","addresses,phoneNumber"],
    DB              :   {
        URI     : process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER    : process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    AUTOENCRYPTIONTIMER: 0 // Don't put too short, as there is a time required to encrypt and save to DB
    // Either way, if the time is too short it will only auto encrypt when the previous is complete!
};
module.exports = config;