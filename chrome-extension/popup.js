// Capture and process lead automatically
document.getElementById('captureBtn').addEventListener('click', async () => {
  await handleCapture();
});

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

    // Send to process-lead-complete endpoint for automatic parsing and creation
    const response = await fetch(`https://hwemookrxvflpinfpkrj.supabase.co/functions/v1/process-lead-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawData: pageData
      })
    });

    const result = await response.json();

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
      throw new Error(result.error || 'Failed to create lead');
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
