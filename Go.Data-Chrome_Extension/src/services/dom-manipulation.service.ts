import { environment } from './../environments/environment';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class DomManipulationService {

  constructor() { }

  /**
   * Gets the current tab document elements, using html injection through chrome API.
   * @returns Returns case data as defined in the environment config, else returns
   * null value.
   * @krunal
   */
  getCaseFromDOM(): Promise<any>{
    return new Promise(async (resolve, reject ) => {
      let code = `let queryResult = {};
        let documents = [];
        let addresses = [];
        let tmp1 = '';
        let documentsAvailable = true;
        let addressesAvailable = true;
        let tempNumber = '';
        let tempType = '';
        let strHtmlNum = '';
        let strHtmlType = '';
        let i = 0;`;
        environment.sensitiveData.forEach(sensitiveField => {
          const sensitiveFieldArray = sensitiveField.split(',');
          if (sensitiveFieldArray.length === 1) {
            // Single Fields querySelector
            let codeSingleField = `queryResult["${sensitiveField}"] = document.querySelector('input[name="${sensitiveField}"]')?.value;`;
            code = code + codeSingleField;
          } else {
            // Nested Fields querySelector (['documents,number', 'addresses,phoneNumber', 'addresses,emailAddress',...)
            if(sensitiveFieldArray[0] === 'documents'){
              const codeNestedFields = 
              `i=0;documentsAvailable=true;
              while(documentsAvailable){
                strHtmlNum = 'input[name="documents['+i+'][number]"]';
                strHtmlType = 'mat-select[name="documents['+i+'][type]"]';
                tempType = document.querySelector(strHtmlType)?.innerText;
                tempNumber = document.querySelector(strHtmlNum)?.value;
                if(tempType && tempNumber){
                  tmp1 = tempType.replace(/\\s/g, '');
                  if(tmp1 !=='HASHID'){
                    documents.push({type:tmp1,number:tempNumber});
                  }
                }else{
                  documentsAvailable = false;
                }
                i=i+1;
              }
              `;
              code = code + codeNestedFields;
            }else if(sensitiveFieldArray[0] === 'addresses'){
              const codeNestedFields = `i=0;addressesAvailable = true;
              while(addressesAvailable){
                strHtmlNum = 'input[name="addresses['+i+'][${sensitiveFieldArray[1]}]"]';
                tempNumber = document.querySelector(strHtmlNum)?.value;
                if(tempNumber){
                  addresses.push({type:'${sensitiveFieldArray[1]}',number:tempNumber});
                }else{
                  addressesAvailable = false;
                }
                i=i+1;
              }
              `;
              code = code + codeNestedFields;
            }
          } 

        });
        code = code +  `queryResult["addresses"]=addresses;queryResult["documents"]=documents;return queryResult;`;
        code = `(function (){${code}})();`;
      // @ts-ignore
      chrome.runtime.sendMessage( {code}, function(_: any) {});
      // @ts-ignore
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        if(tabs){
          // @ts-ignore
          chrome.tabs.executeScript(tabs[0].id, {code }, (result: any) => {
            // @ts-ignore
            // tslint:disable-next-line:only-arrow-functions
            chrome.runtime.sendMessage( {getCaseFrom: result}, function(_: any) {});
            // @ts-ignore
            // tslint:disable-next-line:only-arrow-functions
            chrome.runtime.sendMessage( {getCaseFromDOM: result[0]}, function(_: any) {});
            return resolve( result[0]);
          });
        }
      } );
    });
  }
  /* const code = `(()=>{
      // Static fields
      const firstName = document.querySelector('input[name="firstName"]')?.value;
      const middleName = document.querySelector('input[name="middleName"]')?.value;
      const lastName = document.querySelector('input[name="lastName"]')?.value;
      // Documents and Identification types and Numbers
      let documents = [];
      let documentsAvailable = true;
      let tempNumber = undefined; let tempType = undefined;
      let i = 0;
      let strHtmlNum = 'input[name="documents[0][number]"]';
      let strHtmlType = 'mat-select[name="documents[0][type]"]';
      while(documentsAvailable){
        strHtmlNum = 'input[name="documents['+i+'][number]"]';
        strHtmlType = 'mat-select[name="documents['+i+'][type]"]';
        tempType = document.querySelector(strHtmlType)?.innerText;
        tempNumber = document.querySelector(strHtmlNum)?.value;
        if(tempType == undefined || tempNumber == undefined){
          // No more documents in the current tab/go Data Case
          documentsAvailable = false;
        }else{
          // Store the Type and Number in the Object
          documents.push({type:tempType.replace(/\\s/g, ''),number:tempNumber});
        }
        i=i+1;
      }
      // Addresses and PhoneNumber
         // addresses[#Num][phoneNumber]
         let addressesAvailable = true;
         let addresses = [];
         i = 0;
         let strHtmlAddressesPhoneNumber = 'input[name="addresses['+i+'0][phoneNumber]"]';
         while(addressesAvailable){
          strHtmlAddressesPhoneNumber = 'input[name="addresses['+i+'][phoneNumber]"]';
          tempNumber = document.querySelector(strHtmlAddressesPhoneNumber)?.value;
          if(tempNumber){
            // Store the Type and Number in the Addresses
            addresses.push({type:'phoneNumber',phoneNumber: tempNumber});
          }else{
            // No more Addresses PhoneNumbers in the current chrome-tab and/or go-Data Case
            addressesAvailable = false;
          }
          i=i+1;
        }
        return { firstName, middleName, lastName, documents, addresses };
      })()`; */

  /**
   * Injects the decrypted fields into the current tab of the extension.
   * @returns Returns nothing.
   * @krunal
   * @param decryptedFields - Object{'firstName', 'middleName', 'lastName', 'documents,number', 'addresses,phoneNumber'}
   */
  injectValues(decryptedFields: any){
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      const url = tabs[0].url;
      // @ts-ignore
      // tslint:disable-next-line:only-arrow-functions
      chrome.runtime.sendMessage({URL: url}, function(_: any) {});
      // TODO : LOOP OVER ALL OF THE PROPERTIES IN DECRYPTED FIELD AND USE THAT TO INJECT THE VALUES ON THE GODATA PAGE
      Object.keys(decryptedFields).forEach((key, _) => {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        // REDO
        // @ts-ignore First Name
        chrome.tabs.executeScript(
          tabs[0].id,
          { code: `document.querySelector('input[name="${key}"]') ? document.querySelector('input[name="${key}"]').value="${decryptedFields[key]}":x=0;` }
        );
      });
    } );
  };
}
