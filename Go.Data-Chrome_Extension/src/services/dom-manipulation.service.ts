import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DomManipulationService {

  constructor() { }

  /**
   * Gets the current tab document elements, using html injection through chrome API.
   * @returns Returns case elements as defined in the environment config, else returns
   * null value.
   * @krunal
   */
  getCaseFromDOM(){
    const code = `(()=>{
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
       // addresses[0][phoneNumber]
       let addressesAvailable = true;
       let addresses = [];
       i = 0;
       let strHtmlAddressesPhoneNumber = 'input[name="addresses['+i+'0][phoneNumber]"]';
       let strHtmlAddressesType = 'mat-select[name="addresses[0][typeId]"]';
       while(addressesAvailable){
        strHtmlAddressesPhoneNumber = 'input[name="addresses['+i+'][phoneNumber]"]';
        strHtmlAddressesType = 'mat-select[name="addresses['+i+'][type]"]';
        tempType = document.querySelector(strHtmlAddressesType)?.innerText;
        tempPhoneNumber = document.querySelector(strHtmlAddressesPhoneNumber)?.value;
        if(tempPhoneNumber == undefined || tempType == undefined){
          // No more Addresses PhoneNumbers in the current tab/go Data Case
          addressesAvailable = false;
        }else{
          // Store the Type and Number in the Object
          addresses.push({type:tempType.replace(/\\s/g, ''),phoneNumber:tempPhoneNumber});
        }
        i=i+1;
      }
      //console.log("Obtained Log: ",{ firstName, middleName, lastName, documents, addresses });
      return { firstName, middleName, lastName, documents, addresses };
    })()`;
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // @ts-ignore
      chrome.tabs.executeScript(tabs[0].id, { code }, (result) => {
        console.log('Result on Execution');
        console.log(result);
        return result[0];
      });
    } );
  }
  /**
   * Injects the decrypted fields into the current tab of the extension.
   * @returns Returns nothing.
   * @krunal
   * @param decryptedFields - Object{'firstName', 'middleName', 'lastName', 'documents,number', 'addresses,phoneNumber'}
   */
  injectValues(decryptedFields){
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('tabs', tabs);
      const url = tabs[0].url;
      console.log('url: ', url);
      // @ts-ignore
      chrome.tabs.executeScript(
        tabs[0].id,
        { code: `console.log("URL: ", "${url}");` }
      );
      // TODO : LOOP OVER ALL OF THE PROPERTIES IN DECRYPTED FIELD AND USE THAT TO INJECT THE VALUES ON THE GODATA PAGE

      Object.keys(decryptedFields).forEach((key, index) => {
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
  }
}
