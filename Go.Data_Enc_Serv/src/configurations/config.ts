//Configuration File for Localhost server of GoData
interface IConfig {
    URL : string,
    IV_LENGTH : number,
    saltRounds : number,
    USER :string,
    PASSWORD : string,
    USER_AGENT : string,
    OUTBREAK_ID : string,
    sensitiveData : Array<string>,
    DB: {
        URI: string,
        USER: string,
        PASSWORD: string
    },
    autoEncryptSeconds: number
}
const config:IConfig = {
    URL : "http://localhost:8000/api", //Go Data URI
    IV_LENGTH : 16, // Minimum Length 16 IV
    saltRounds : 10, // Hash Function Rounds, recommended for security at least 10
    USER :"krunal@krunal.com",
    PASSWORD : "kruskechi123",
    USER_AGENT : "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID : "336be6ba-07e3-4001-b040-b559a0fdd7d3",
    sensitiveData : ["firstName","middleName","lastName","documents,number","addresses,phoneNumber"],
    DB: {
        URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER: process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    autoEncryptSeconds: 60 // Don't put too short, as there is a time required to encrypt and save to DB
    // Either way, if the time is too short it will only auto encrypt when the previous is complete!
};
module.exports = config;