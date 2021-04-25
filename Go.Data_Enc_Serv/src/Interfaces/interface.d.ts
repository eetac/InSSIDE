// interfaces.ts

interface IConfig {
    URL :string,
    IV_LENGTH :number,
    saltRounds :number,
    EMAIL :string,
    HOSPITAL   :string,// Hospital Name, in our case it is the administrator name for DRM server
    PASSWORD :string,
    USER_AGENT :string,
    USER_GODATA_ID :string,
    DOCUMENT_HASH :string,
    OUTBREAK_ID :string,
    SENSITIVE_DATA :Array<string>,
    DB: {
        URI: string,
        USER: string,
        PASSWORD: string
    },
    AUTO_ENCRYPTION_TIMER: number
}

export {
    // Exporting Interfaces
    IConfig
}
