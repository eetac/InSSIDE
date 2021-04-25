//Configuration File for Localhost server of GoData

import {IConfig} from "../Interfaces/interface";

const config:IConfig = {
    URL             :   "http://localhost:80/api", //Go Data URI
    IV_LENGTH       :   16, // Minimum Length 16 IV
    saltRounds      :   10, // Hash Function Rounds, recommended for security at least 10
    EMAIL            :   "encryption@local.com",
    USER_NAME       :   "admin", // Hospital Name, in our case it is the administrator name for DRM server
    USER_GODATA_ID    :   "1e054e83-e335-432a-87c5-6f1b5e34d3b9",
    PASSWORD        :   "kruskechi1234",
    DOCUMENT_HASH   :   "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID",
    USER_AGENT      :   "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID     :   "12b593e4-6de2-4cbd-a4be-464f55bf57e0",
    SENSITIVE_DATA   :   ["firstName","middleName","lastName","documents,number","addresses,phoneNumber"],
    DB              :   {
        URI     : process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER    : process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    AUTO_ENCRYPTION_TIMER: 0 // Don't put too short, as there is a time required to encrypt and save to DB
    // Either way, if the time is too short it will only auto encrypt when the previous is complete!
};
module.exports = config;
