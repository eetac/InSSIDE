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
                  addresses.push({type:'${sensitiveFieldArray[1]}',${sensitiveFieldArray[1]}:tempNumber});
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

  /**
   * Injects the decrypted fields into the current tab of the extension.
   * @returns Returns nothing.
   * @krunal
   * @param decryptedCase - Object{'firstName', 'middleName', 'lastName', 'cip', 'phoneNumber'}
   */
  injectValues(decryptedCase: any){
    let code:string = `
    let documentSelector;
    `;
    environment.sensitiveData.forEach(sensitiveField => {
      const sensitiveFieldArray = sensitiveField.split(',');
      // If there is a document we have address,phoneNumber
      if (sensitiveFieldArray.length === 1) {
        // If the beginning of the value is equal to /ENC/ we decrypt the field
        if (decryptedCase[sensitiveField]) {
          // tslint:disable-next-line:triple-equals
          let codeSingleField = `
          document.querySelector('input[name="${sensitiveField}"]').value = '${decryptedCase[sensitiveField]}';
          `;
          code = code + codeSingleField;
        }
      } else if (sensitiveFieldArray.length === 2) {
        if (decryptedCase[`${sensitiveFieldArray[0]}`]) {
          decryptedCase[`${sensitiveFieldArray[0]}`].forEach((sensitiveDocument: any, index: number) => {
            let codeMultipleField = `
            documentSelector = 'input[name="${sensitiveFieldArray[0]}[${index}][${sensitiveFieldArray[1]}]"]';
            tempNumber = document.querySelector(documentSelector).value = '${sensitiveDocument[sensitiveFieldArray[1]]}';
            `
            code = code + codeMultipleField;
          });
        }
      }
    });
    code = `(function (){${code}})();`;
    // @ts-ignore
    chrome.runtime.sendMessage( {code}, function(_: any) {});
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if(tabs){
        // @ts-ignore
        chrome.tabs.executeScript(tabs[0].id, {code}, (_: any) => {
          return true;
        });
      }
    } );
  };
}
