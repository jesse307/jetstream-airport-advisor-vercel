# Lead Capture Chrome Extension

This Chrome extension captures lead data from Salesforce pages and sends it to your lead import system.

## Installation Instructions

1. **Download the Extension Files**
   - Download all files in the `chrome-extension` folder to your computer
   - Keep them all in the same folder

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Go to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Lead Capture for Charter"
   - Click the pin icon to keep it visible

## How to Use

1. Navigate to a Salesforce lead page
2. Click the extension icon in your Chrome toolbar
3. Click "Capture Page Data"
4. The extension will:
   - Extract all visible data from the page
   - Send it to your webhook
   - Open your Lead Import page in a new tab
5. Review the captured data in "Pending Imports"

## Troubleshooting

- **Extension not working**: Make sure you're on a Salesforce page (*.salesforce.com or *.force.com)
- **Data not appearing**: Check that the webhook URL is correct in popup.js
- **Permission errors**: Make sure you granted the extension permission to access Salesforce pages

## Files Included

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Main capture logic
- `content.js` - Content script for Salesforce pages
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons
