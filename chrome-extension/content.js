// Content script that runs on Salesforce pages
// This can be used for additional functionality in the future

console.log('Lead Capture extension loaded on:', window.location.href);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureData') {
    const pageData = {
      title: document.title,
      url: window.location.href,
      content: document.body.innerText
    };
    sendResponse({ success: true, data: pageData });
  }
  return true;
});
