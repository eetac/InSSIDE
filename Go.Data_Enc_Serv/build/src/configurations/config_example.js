//Example of the different fields in the configuration file
const configExample = {
    URL: "http://localhost:3000/api",
    IV_LENGTH: 16,
    saltRounds: 10,
    USER: "krunal@krunal.com",
    PASSWORD: "kruskechi1234",
    USER_AGENT: "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID: "336be6ba-07e3-4001-b040-b559a0fdd7d3",
    sensitiveData: ["firstName", "middleName", "lastName", "documents,number", "addresses,phoneNumber"],
    DB: {
        URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER: process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    autoEncryptSeconds: 60
};
module.exports = config;
