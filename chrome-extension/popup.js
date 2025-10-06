// Capture and process lead automatically
document.getElementById('captureBtn').addEventListener('click', async () => {
  await handleCapture();
});

// Check authentication on load
checkAuth();

async function checkAuth() {
  const status = document.getElementById('status');
  
  // Try to get the session from the Lovable app
  try {
    const response = await chrome.tabs.query({ url: "https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/*" });
    
    if (response.length === 0) {
      status.className = 'status error';
      status.textContent = '⚠ Please log in to the Charter Pro app first';
      status.style.display = 'block';
      
      // Offer to open the app
      document.getElementById('captureBtn').textContent = 'Open Charter Pro';
      document.getElementById('captureBtn').onclick = () => {
        chrome.tabs.create({
          url: 'https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/'
        });
      };
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

async function handleCapture() {
  const captureBtn = document.getElementById('captureBtn');
  const status = document.getElementById('status');
  
  captureBtn.disabled = true;
  const originalText = captureBtn.textContent;
  captureBtn.innerHTML = '<span class="loader"></span>Processing...';
  status.className = 'status';
  status.style.display = 'none';

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute script to capture page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: capturePage
    });

    const pageData = results[0].result;
    
    // Get auth token from the Charter Pro app tab
    const appTabs = await chrome.tabs.query({ 
      url: "https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/*" 
    });
    
    let authToken = null;
    if (appTabs.length > 0) {
      // Execute script to get the Supabase session from localStorage
      const authResults = await chrome.scripting.executeScript({
        target: { tabId: appTabs[0].id },
        func: () => {
          // Get all localStorage items to find the correct session key
          const allKeys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('supabase') || key.includes('sb-')) {
              allKeys.push(key);
              console.log('Found storage key:', key);
            }
          }
          
          // Try to find the session in the correct format
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.includes('auth-token')) {
              const session = localStorage.getItem(key);
              console.log('Checking key:', key, 'Value length:', session?.length);
              if (session) {
                try {
                  const parsed = JSON.parse(session);
                  console.log('Parsed session structure:', Object.keys(parsed));
                  
                  // Handle different possible session formats
                  if (parsed.access_token) {
                    console.log('Found access_token directly');
                    return { token: parsed.access_token, key: key };
                  } else if (parsed.currentSession?.access_token) {
                    console.log('Found access_token in currentSession');
                    return { token: parsed.currentSession.access_token, key: key };
                  } else {
                    console.log('Session structure:', JSON.stringify(parsed, null, 2).substring(0, 200));
                  }
                } catch (e) {
                  console.error('Parse error for key:', key, e);
                }
              }
            }
          }
          console.error('No valid session found. Keys checked:', allKeys);
          return null;
        }
      });
      
      const authData = authResults[0]?.result;
      authToken = authData?.token;
      
      if (authData) {
        console.log('Retrieved token from key:', authData.key, 'Token length:', authToken?.length);
      }
    }

    if (!authToken) {
      status.className = 'status error';
      status.textContent = '⚠ No auth token found. Please log in to Charter Pro first.';
      status.style.display = 'block';
      console.error('No auth token retrieved from app tab');
      
      setTimeout(() => {
        chrome.tabs.create({
          url: 'https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/auth'
        });
      }, 1500);
      return;
    }
    
    console.log('Auth token retrieved, length:', authToken.length);
    console.log('First 50 chars of token:', authToken.substring(0, 50));

    console.log('Sending request with auth token');

    // Send to process-lead-complete endpoint for automatic parsing and creation
    const response = await fetch(`https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/process-lead-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3ZW1vb2tyeHZmbHBpbmZwa3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTQ5MTksImV4cCI6MjA3NDQ5MDkxOX0.TTCRQZbm_cIGAusk8C3AhTbH6BPWmbsFr02mxLQ0-iY',
      },
      body: JSON.stringify({
        rawData: pageData
      })
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);

    if (response.ok && result.leadId) {
      status.className = 'status success';
      status.textContent = '✓ Lead created successfully!';
      status.style.display = 'block';
      
      // Open the Lead Analysis page for this specific lead
      setTimeout(() => {
        chrome.tabs.create({
          url: `https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/leads/${result.leadId}`
        });
      }, 500);
    } else {
      console.error('Error response:', result);
      throw new Error(result.error || `Failed to create lead (Status: ${response.status})`);
    }
  } catch (error) {
    status.className = 'status error';
    status.textContent = '✗ Error: ' + error.message;
    status.style.display = 'block';
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = originalText;
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
