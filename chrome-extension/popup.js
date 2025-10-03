// Push to Site button - sends data to pending imports for manual review
document.getElementById('pushToSiteBtn').addEventListener('click', async () => {
  await handleCapture('push-to-site');
});

// Complete Workflow button - automated processing all the way to Make.com
document.getElementById('completeWorkflowBtn').addEventListener('click', async () => {
  await handleCapture('complete-workflow');
});

async function handleCapture(mode) {
  const pushBtn = document.getElementById('pushToSiteBtn');
  const completeBtn = document.getElementById('completeWorkflowBtn');
  const status = document.getElementById('status');
  
  pushBtn.disabled = true;
  completeBtn.disabled = true;
  
  const activeBtn = mode === 'push-to-site' ? pushBtn : completeBtn;
  const originalText = activeBtn.textContent;
  activeBtn.innerHTML = '<span class="loader"></span>Processing...';
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

    // Choose endpoint based on mode
    const endpoint = mode === 'complete-workflow' 
      ? 'process-lead-complete'
      : 'receive-lead-webhook';

    // Send to webhook
    const response = await fetch(`https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawData: pageData
      })
    });

    const result = await response.json();

    if (response.ok) {
      status.className = 'status success';
      
      if (mode === 'push-to-site') {
        status.textContent = '✓ Data captured successfully!';
        // Open the Lead Import page
        chrome.tabs.create({
          url: 'https://300e3d3f-6393-4fa8-9ea2-e17c21482f24.lovableproject.com/leads/import'
        });
      } else {
        status.textContent = '✓ Lead processed and sent to Make.com!';
      }
    } else {
      throw new Error(result.error || 'Failed to process data');
    }
  } catch (error) {
    status.className = 'status error';
    status.textContent = '✗ Error: ' + error.message;
  } finally {
    pushBtn.disabled = false;
    completeBtn.disabled = false;
    activeBtn.textContent = originalText;
    status.style.display = 'block';
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
