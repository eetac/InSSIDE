//Configuration File for Localhost server of GoData

import {IConfig} from "../Interfaces/interface";

const config:IConfig = {
    URL             :   "http://localhost:3000/api", //Go Data URI
    IV_LENGTH       :   16, // Minimum Length 16 IV
    saltRounds      :   10, // Hash Function Rounds, recommended for security at least 10
    EMAIL           :   "encryption@local.com",
    HOSPITAL        :   "admin", // Hospital Name, in our case it is the administrator name for DRM server
    USER_GODATA_ID  :   "9fd48f7a-58c9-44de-836b-5743c9845b3b",
    PASSWORD        :   "kruskechi1234",
    DOCUMENT_HASH   :   "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID",
    USER_AGENT      :   "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID     :   "33227825-a497-46ae-a8b9-8ee30921db3e",
    SENSITIVE_DATA   :   ["firstName","middleName","lastName","documents,number","addresses,phoneNumber"],
    DB              :   {
        URI     : process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER    : process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    AUTO_ENCRYPTION_TIMER: 0 // If the time is too short it will only auto encrypt when the previous is complete!
};
module.exports = config;
