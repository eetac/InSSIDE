# GoData extension offering DRM service

_Anonymization of GoData cases which helps provide the anonymization of patiens without loosing the ability of GoData contact tracing. Thus providing privacy and security for patient sensitive data while keeping unsensitive information available for the hospitals and epidemiologist_

## Taking off 🚀

_These instructions will allow you to get a copy of the project running on your local machine for development and testing purposes._

Go to **Deployment** to deploy the project.


### Pre-requisites 📋

_First and foremost ._
```
Running GoData Server with a User is required
```
_Second a mongodb BDD is required._
```
MongoDB connection URI must be provided in 
Go.Data_Enc_Serv\src\database.ts
```
### Installation 🔧

_To be able to deploy the DRM Server, just use_

_npm install_

```
cd Go.Data_Enc_Serv\
npm install
```

_and repeat the process, to deploy chrome anonymization extension_

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
 URL: GoData API location
 USER: Email used to enter godata server
 PASSWORD: Password in clear, used to access GoData
 OUTBREAK_ID: Outbreak Id in GoData
 sensitiveData: Fields we want to protect, such as firstName
                Must match with GoData!
```

## Tests ⚙️

_Explained how to test, different endpoints. _
```
No tests implemented Yet!
```
### End-to-End Testing 🔩

_Endpoints results from tests_

```
Not End2End tests implemented,yet!
```

## Deployment 📦

_To be able to deploy successfully, the prerequisites must be fullfilled and Installation must be completed._
_If this are met, than just follow the commands below in terminals to deploy._ 
```
Terminal 1
cd Go.Data_Enc_Serv\
npm run clean
npm run build
npm run start
//Server must be running
```
```
Terminal 2
cd Go.Data-Chrome_Extension\
npm run build
npm run start
//Anonymization Connector running at localhost:4200/
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



---
⌨️ with ❤️ from [Krunal](https://github.com/krunalmiracle) 😊