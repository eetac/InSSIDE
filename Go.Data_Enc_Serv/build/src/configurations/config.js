const config = {
    URL: "http://localhost:8000/api",
    IV_LENGTH: 16,
    saltRounds: 10,
    USER: "encryption@local.com",
    USERGODATAID: "7ce62a91-c897-4422-be86-22bc584392eb",
    INSTITUTION: "SALUT",
    PASSWORD: "kruskechi1234",
    DOCUMENT_HASH: "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID",
    USER_AGENT: "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID: "24cdb348-a7aa-463b-a45d-fff005ae4952",
    SENSITIVEDATA: ["firstName", "middleName", "lastName", "documents,number", "addresses,phoneNumber"],
    DB: {
        URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER: process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    AUTOENCRYPTIONTIMER: 15 // Don't put too short, as there is a time required to encrypt and save to DB
    // Either way, if the time is too short it will only auto encrypt when the previous is complete!
};
module.exports = config;
