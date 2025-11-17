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
    // Check both preview and production URLs
    let response = await chrome.tabs.query({ url: "https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/*" });
    
    if (response.length === 0) {
      // Try preview URL
      response = await chrome.tabs.query({ url: "https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/*" });
    }
    
    if (response.length === 0) {
      status.className = 'status error';
      status.textContent = '⚠ Please log in to the Charter Pro app first';
      status.style.display = 'block';
      
      // Offer to open the app
      document.getElementById('captureBtn').textContent = 'Open Charter Pro';
      document.getElementById('captureBtn').onclick = () => {
        chrome.tabs.create({
          url: 'https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/'
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
  
  // Update status
  captureBtn.innerHTML = '<span class="loader"></span>Capturing page...';
  status.className = 'status info';
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
    
    // Update status
    captureBtn.innerHTML = '<span class="loader"></span>Processing lead...';
    status.className = 'status info';
    status.textContent = '📄 Page captured successfully';
    status.style.display = 'block';
    
    // Get Charter Pro app tabs - check both preview and production
    let appTabs = await chrome.tabs.query({ 
      url: "https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/*" 
    });
    
    if (appTabs.length === 0) {
      appTabs = await chrome.tabs.query({ 
        url: "https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app/*" 
      });
    }
    
    // Store Charter Pro tab ID for navigation
    const charterProTabId = appTabs.length > 0 ? appTabs[0].id : null;
    
    // Update status
    captureBtn.innerHTML = '<span class="loader"></span>Authenticating...';
    
    // Get user ID directly from Charter Pro localStorage
    let userId = null;
    if (appTabs.length > 0) {
      try {
        const userResults = await chrome.scripting.executeScript({
          target: { tabId: appTabs[0].id },
          func: () => {
            const result = {
              userId: null,
              keys: [],
              sessionData: null
            };
            
            // Log all localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              result.keys.push(key);
            }
            
            console.log('All localStorage keys:', result.keys);
            
            // Search for Supabase session in localStorage
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-') && key.includes('auth-token')) {
                const session = localStorage.getItem(key);
                console.log('Found session key:', key, 'Length:', session?.length);
                if (session) {
                  try {
                    const parsed = JSON.parse(session);
                    result.sessionData = {
                      hasUser: !!parsed.user,
                      hasCurrentSession: !!parsed.currentSession,
                      topLevelKeys: Object.keys(parsed)
                    };
                    console.log('Session structure:', result.sessionData);
                    
                    // Try different session formats
                    if (parsed.user?.id) {
                      result.userId = parsed.user.id;
                      console.log('Found user ID in parsed.user.id');
                    } else if (parsed.currentSession?.user?.id) {
                      result.userId = parsed.currentSession.user.id;
                      console.log('Found user ID in parsed.currentSession.user.id');
                    } else {
                      console.log('No user.id found in session');
                    }
                  } catch (e) {
                    console.error('Parse error:', e);
                  }
                }
              }
            }
            return result;
          }
        });
        
        const result = userResults[0]?.result;
        console.log('LocalStorage inspection:', result);
        userId = result?.userId;
        
        if (!userId) {
          console.error('No user ID found. Keys checked:', result?.keys);
          console.error('Session data:', result?.sessionData);
        } else {
          console.log('Successfully got user ID:', userId);
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    }

    if (!userId) {
      throw new Error('Not authenticated. Please log in to Charter Pro first.');
    }

    console.log('Processing lead with user ID:', userId);
    
    // Update status
    captureBtn.innerHTML = '<span class="loader"></span>Creating lead...';
    status.textContent = '🔐 Authenticated successfully';
    status.className = 'status info';
    status.style.display = 'block';

    // Send to process-lead-complete endpoint for automatic parsing and creation
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

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Failed to process lead: ${errorText}`);
    }

    const result = await response.json();
    console.log('Lead processed successfully:', result);

    captureBtn.innerHTML = '✅ Success!';
    status.className = 'status success';
    status.textContent = '✅ Lead captured and created successfully!';
    status.style.display = 'block';
      
      // Use the same URL pattern as the app tab we found
      const baseUrl = appTabs[0].url.includes('lovable.app') 
        ? 'https://id-preview--300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovable.app'
        : 'https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com';
      
      // Show final success status
      captureBtn.innerHTML = '✅ Opening lead...';
      status.textContent = '✅ Lead created! Opening in Charter Pro...';
      
      // Navigate in the existing Charter Pro tab instead of creating a new one
      setTimeout(() => {
        if (charterProTabId) {
          chrome.tabs.update(charterProTabId, {
            url: `${baseUrl}/lead-analysis/${result.leadId}`,
            active: true
          });
        } else {
          chrome.tabs.create({
            url: `${baseUrl}/lead-analysis/${result.leadId}`
          });
        }
      }, 500);
  } catch (error) {
    console.error('Capture error:', error);
    captureBtn.innerHTML = '❌ Failed';
    status.className = 'status error';
    status.textContent = '❌ ' + error.message;
    status.style.display = 'block';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      captureBtn.disabled = false;
      captureBtn.textContent = originalText;
    }, 2000);
  } finally {
    // Only reset if not showing error
    if (!status.classList.contains('error')) {
      setTimeout(() => {
        captureBtn.disabled = false;
        captureBtn.textContent = originalText;
      }, 2000);
    }
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
