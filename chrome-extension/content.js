// Content script that runs on Salesforce pages and Charter Pro pages
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
  
  if (request.action === 'getUserId') {
    // Try to get user ID from Supabase localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('auth-token')) {
          const session = localStorage.getItem(key);
          if (session) {
            const parsed = JSON.parse(session);
            // Try different session formats
            let userId = null;
            if (parsed.user?.id) {
              userId = parsed.user.id;
            } else if (parsed.currentSession?.user?.id) {
              userId = parsed.currentSession.user.id;
            }
            
            if (userId) {
              sendResponse({ success: true, userId: userId });
              return true;
            }
          }
        }
      }
      sendResponse({ success: false, error: 'No user session found' });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true;
});
