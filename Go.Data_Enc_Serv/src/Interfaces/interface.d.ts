// interfaces.ts

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

export {
    // Exporting Interfaces
    IConfig
}
