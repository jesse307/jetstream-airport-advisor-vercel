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
  
  if (request.action === 'updateLeadStatus') {
    try {
      // First, make sure we're in edit mode
      const editButton = document.querySelector('button[name="Edit"]');
      if (editButton) {
        console.log('Clicking edit button...');
        editButton.click();
        
        // Wait a bit for edit mode to load
        setTimeout(() => {
          updateStatus(sendResponse);
        }, 1500);
        
        return true; // Keep connection open for async response
      } else {
        // Already in edit mode, try to update
        updateStatus(sendResponse);
        return true;
      }
    } catch (error) {
      console.error('Error updating status:', error);
      sendResponse({ success: false, error: error.message });
    }
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

function updateStatus(sendResponse) {
  try {
    // Find the Lead Status combobox button
    const comboboxButton = Array.from(document.querySelectorAll('button[aria-label="Lead Status"]'))
      .find(btn => btn.getAttribute('role') === 'combobox');
    
    if (!comboboxButton) {
      sendResponse({ success: false, error: 'Could not find Lead Status field' });
      return;
    }
    
    console.log('Found combobox, current value:', comboboxButton.dataset.value);
    
    // Click to open the dropdown
    comboboxButton.click();
    
    // Wait for dropdown to appear
    setTimeout(() => {
      // Find the "Attempt 2" option in the dropdown
      const options = document.querySelectorAll('lightning-base-combobox-item');
      let attempt2Option = null;
      
      options.forEach(option => {
        const text = option.textContent.trim();
        if (text === 'Attempt 2') {
          attempt2Option = option;
        }
      });
      
      if (attempt2Option) {
        console.log('Found Attempt 2 option, clicking...');
        attempt2Option.click();
        
        // Wait a moment, then click Save
        setTimeout(() => {
          const saveButton = document.querySelector('button[name="SaveEdit"]');
          if (saveButton) {
            console.log('Clicking save button...');
            saveButton.click();
            sendResponse({ success: true, message: 'Status updated to Attempt 2' });
          } else {
            sendResponse({ success: false, error: 'Could not find Save button' });
          }
        }, 500);
      } else {
        sendResponse({ success: false, error: 'Could not find "Attempt 2" option in dropdown' });
      }
    }, 500);
    
  } catch (error) {
    console.error('Error in updateStatus:', error);
    sendResponse({ success: false, error: error.message });
  }
}
