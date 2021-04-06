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
  // In this example, message === 'whatever value; String, object, whatever'
  console.log('...Debugging...')
  console.log(message);
  console.log('...End...')
});
