// Queue management for offline captures
const QUEUE_KEY = 'capture_queue';

async function getQueue() {
  const result = await chrome.storage.local.get(QUEUE_KEY);
  return result[QUEUE_KEY] || [];
}

async function addToQueue(pageData, userId) {
  const queue = await getQueue();
  queue.push({ pageData, userId, timestamp: Date.now() });
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
  return queue.length;
}

async function removeFromQueue(index) {
  const queue = await getQueue();
  queue.splice(index, 1);
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
}

async function processQueue() {
  const queue = await getQueue();
  if (queue.length === 0) return;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Processing Queued Captures',
    message: `Processing ${queue.length} queued capture(s)...`
  });

  for (let i = queue.length - 1; i >= 0; i--) {
    try {
      const item = queue[i];
      await processCaptureRequest(item.pageData, item.userId);
      await removeFromQueue(i);
    } catch (error) {
      console.error('Failed to process queued item:', error);
      // Keep in queue for next retry
    }
  }
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on non-network errors
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('log in')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Show retry notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Retrying Lead Capture',
        message: `Network error. Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Process capture request (extracted for reuse)
async function processCaptureRequest(pageData, userId) {
  const result = await retryWithBackoff(async () => {
    const response = await fetch(`https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/process-lead-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZW1vb2tyeHZmbHBpbmZwa3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTQ5MTksImV4cCI6MjA3NDQ5MDkxOX0.TTCRQZbm_cIGAusk8C3AhTbH6BPWmbsFr02mxLQ0-iY',
      },
      body: JSON.stringify({
        rawData: pageData,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to process lead: ${response.status}`);
    }

    return await response.json();
  });

  return result;
}

// Listen for online/offline events
self.addEventListener('online', async () => {
  console.log('Connection restored, processing queue...');
  await processQueue();
});

self.addEventListener('offline', () => {
  console.log('Connection lost, captures will be queued');
});

// Listen for keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-lead') {
    await handleCaptureCommand();
  }
});

async function handleCaptureCommand() {
  try {
    // Show notification that capture is starting
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Lead Capture',
      message: 'Capturing page data...'
    });

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute script to capture page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: capturePage
    });

    const pageData = results[0].result;
    
    // Get Charter Pro app tabs - check both preview and production
    let appTabs = await chrome.tabs.query({ 
      url: "https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/*" 
    });
    
    if (appTabs.length === 0) {
      appTabs = await chrome.tabs.query({ 
        url: "https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/*" 
      });
    }
    
    // Get user ID directly from Charter Pro localStorage
    let userId = null;
    if (appTabs.length > 0) {
      try {
        const userResults = await chrome.scripting.executeScript({
          target: { tabId: appTabs[0].id },
          func: () => {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-') && key.includes('auth-token')) {
                const session = localStorage.getItem(key);
                if (session) {
                  try {
                    const parsed = JSON.parse(session);
                    if (parsed.user?.id) {
                      return parsed.user.id;
                    } else if (parsed.currentSession?.user?.id) {
                      return parsed.currentSession.user.id;
                    }
                  } catch (e) {
                    console.error('Parse error:', e);
                  }
                }
              }
            }
            return null;
          }
        });
        
        userId = userResults[0]?.result;
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }

    if (!userId) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Lead Capture Failed',
        message: 'Please log in to Charter Pro first'
      });
      return;
    }

    // Check if offline
    if (!navigator.onLine) {
      const queueLength = await addToQueue(pageData, userId);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Capture Queued (Offline)',
        message: `Lead capture queued. ${queueLength} item(s) will be processed when connection is restored.`
      });
      return;
    }

    // Send to process-lead-complete endpoint
    const result = await processCaptureRequest(pageData, userId);

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Lead Captured!',
      message: 'Opening lead in Charter Pro...'
    });

    // Use the same URL pattern as the app tab we found
    const baseUrl = appTabs[0].url.includes('lovable.app') 
      ? 'https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app'
      : 'https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com';
    
    // Navigate in the existing Charter Pro tab or create a new one
    if (appTabs.length > 0) {
      chrome.tabs.update(appTabs[0].id, {
        url: `${baseUrl}/leads/${result.leadId}`,
        active: true
      });
    } else {
      chrome.tabs.create({
        url: `${baseUrl}/leads/${result.leadId}`
      });
    }
  } catch (error) {
    console.error('Capture error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Lead Capture Failed',
      message: error.message || 'An error occurred'
    });
  }
}

// This function runs in the context of the web page
function capturePage() {
  const pageTitle = document.title;
  const pageUrl = window.location.href;
  
  // Try to get all visible text
  let pageText = document.body.innerText;
  
  // Try to extract structured data from Salesforce if available
  const salesforceData = [];
  
  // Look for Salesforce field labels and values
  const fields = document.querySelectorAll('.slds-form-element, .dataCol, .labelCol');
  fields.forEach(field => {
    const text = field.innerText?.trim();
    if (text && text.length < 500) {
      salesforceData.push(text);
    }
  });
  
  // Combine all data
  let capturedData = `Page: ${pageTitle}\nURL: ${pageUrl}\n\n`;
  
  if (salesforceData.length > 0) {
    capturedData += 'Salesforce Fields:\n' + salesforceData.join('\n') + '\n\n';
  }
  
  capturedData += 'Full Page Content:\n' + pageText;
  
  // Limit size to prevent issues
  if (capturedData.length > 50000) {
    capturedData = capturedData.substring(0, 50000) + '\n\n[Content truncated]';
  }
  
  return capturedData;
}
