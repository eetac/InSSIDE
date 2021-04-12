chrome.runtime.onInstalled.addListener(() => {
  /*chrome.storage.sync.set({ color: '#3aa757' });*/

  /*chrome.webNavigation.onCompleted.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
      chrome.pageAction.show(id);
    });
  }, { url: [{ urlMatches: 'http://localhost:8000/cases/edf15df1-b89d-474c-b504-c7051a72d54b/view' }] });*/
});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // Handle message.
  console.log(message);
  sendResponse("message for chrome api to close port...");
});
