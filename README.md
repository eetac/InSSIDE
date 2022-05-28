# GoData extension offering DRM service

_Anonymization of GoData cases which helps provide the anonymization of patiens without loosing the ability of GoData contact tracing. Thus providing privacy and security for patient sensitive data while keeping unsensitive information available for the hospitals and epidemiologist_

## Demo video 📹



https://user-images.githubusercontent.com/70297984/170833928-57618231-e8bf-4c59-b659-68890b84d6ff.mp4


## Taking off 🚀

_These instructions will allow you to get a copy of the project running on your local machine for development and testing purposes._

Go to **Deployment** to deploy the project.


### Pre-requisites 📋

1. Running GoData Server with registered User is required
2. Add 2 new reference data for documents as follows
    a. "CIP"
    b. "HashId"
  ~psst<Without the quotemarks>
4. Mongodb BDD is required

### Installation 🔧

_First install the DRM Server packages,_
```
cd Go.Data_Enc_Serv\
npm install
```
_Next install packages for chrome anonymization extension_
```
cd Go.Data_Enc_Serv\
npm install
```
_Also need to configure the GoData URL which lets know the DRM server where the GoData server is located, which could be a real location, or can be the locally hosted GoData._

```
Make a copy of the file Go.Data_Enc_Serv\src\lib\config_example.ts and rename it to config.ts 
```
_Once we have a config.ts file, we need to fill the empty values_
```
    URL             :   "http://localhost:3000/api", //Go Data URI
    IV_LENGTH       :   16, // Minimum Length 16 IV
    saltRounds      :   10, // Hash Function Rounds, recommended for security at least 10
    EMAIL           :   "encryption@local.com", //Email used to enter godata server for admin
    HOSPITAL        :   "admin", // Hospital Name, in our case it is the administrator name for DRM server
    USER_GODATA_ID  :   "9fd48f7a-58c9-44de-836b-5743c9845b3b",
    PASSWORD        :   "NobodyShallPass", //Password in clear, used to access GoData
    DOCUMENT_HASH   :   "LNG_REFERENCE_DATA_CATEGORY_DOCUMENT_TYPE_HASHID",
    USER_AGENT      :   "GoData LocalHost Connector 2.5.6",
    OUTBREAK_ID     :   "33227825-a497-46ae-a8b9-8ee30921db3e", //Outbreak Id in GoData
    SENSITIVE_DATA   :   ["firstName","middleName","lastName","documents,number","addresses,phoneNumber"],
    // MongoDB Uri for DRM server, different from GoData/can be the same too!
    DB              :   {
        URI     : process.env.MONGODB_URI || 'mongodb://localhost:27017/DRM',
        USER    : process.env.MONGODB_USER,
        PASSWORD: process.env.MONGODB_PASSWORD
    },
    AUTO_ENCRYPTION_TIMER: 0 // If the time is too short it will only auto encrypt when the previous is complete!
```
## Tests ⚙️

**Explained how to test Encryption & Decryption**
1. Register with hospital name in chrome extension, where the hospital is domain of the email address.
**user@hospital1.com -> Register with "hospital1" in chrome.**
**Store the private key in clipboard to a txt file.***
2. Add a case with CIP, and the sensitive Fields as configured in SENSITIVE_DATA in config.ts_OBLIGATORY REQUIREMENT
3. Encrypt the Data -> No action required if programmed in config.ts as a AUTO_ENCRYPTION_TIMER > 0 or force it from a browser
```
    Type in browser as a URL
    localhost:4000/encrypt
    Must return Encrypted succesfully
```
3. Now if we access GoData, the cases sensitive information is protected.
4. To decrypte, we just need to open the extension.
3. And the case sensitive information will be visible.

### End-to-End Testing 🔩

_Endpoints tests_

```
No End2End tests implemented,yet!
```

## Deployment 📦

_To be able to deploy successfully, the prerequisites must be fullfilled and Installation must be completed._
_If this are met, just follow the commands below in terminals to deploy._ 
```
Terminal 1
cd Go.Data_Enc_Serv\
npm run clean
npm run build
npm run start
//Server has initialized and is awaiting
```
```
Terminal 2
cd Go.Data-Chrome_Extension\
npm run build
```
// Now load the extension in Chrome 
```
1. Enable developer mode in chrome extensions
2. Load uncompressed extension
3. Register with hospital name in chrome extension, where the hospital is domain of the email address. user@hospital1.com -> Register with "hospital1" in chrome. 
4. Store the private key in clipboard to a txt file.*    
5. Ready to work!
```
## Built With 🛠️

_Tools used during the development lifecycle_

* [AngularTs](http://angular.io/) - Web Framework used
* [npm](https://www.npmjs.com/) - Dependency manager
* [NodeJS](https://nodejs.org/es/) - Backend API

## Contribuition 🖇️

Please read the [CONTRIBUTING.md](https://FutureTodo) for details about our codebase and to process any pull requests.

## Wiki 📖

More details about the project can be found at [GoData](https://community-godata.who.int/conversations/interoperability/call-of-interest-piloting-anonymization-browser-extension-for-godata/5f903dccbd25503aeafce307)

## Versioning 📌

We used [scrum](https://devmethodologies.blogspot.com/2016/09/agile-version-control.html) for versioning and the [tags of this project](https://github.com/eetac/InSSIDE/tags).

## Authors ✒️

_This project wouldn't have been able to reach where it is today, without the help of:_

* **Alberto Abelló Gamazo** - *PDI - Associate Professor* - [UPC](https://futur.upc.edu/AlbertoAbelloGamazo)
* **Jesús Alcober i Segura** - *PDI - Associate Professor* - [UPC](http://futur.upc.edu/JesusAngelAlcoberSegura)
* **Juan López Rubio** - *PDI - Collaborating Professor* - [UPC](https://futur.upc.edu/JuanLopezRubio)
* **Antoni Oller i Arcas** - *PDI - Collaborating Professor* - [UPC](https://futur.upc.edu/AntonioOllerArcas)
* **Krunal Ratan Badsiwal** - *Collaborating Student* - [Linkedin](linkedin.com/in/krunal-badsiwal)
* **Alberto Contreras Martínez** - *Collaborating Student* - [Linkedin](linkedin.com/in/alberto-contreras-martínez)

## License 📄

This project is under the EETAC (The MIT License) - Read the license agreement [LICENSE.md](LICENSE.md) for details.

## Gratitudes 🎁
* Thanks GoData Team for helping all the way through! ❤️.
* Thanks UPC for funding such an amazing project! ❤️.
---
⌨️ with ❤️ from [Krunal](https://github.com/krunalmiracle) 😊
