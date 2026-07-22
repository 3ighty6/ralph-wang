import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let permissionGranted = false;
let lastRequest = null;

/**
 * POST /api/request-permission
 * User describes what they want, agent prepares permission request
 */
app.post('/api/request-permission', (req, res) => {
  const { request } = req.body;
  
  if (!request || request.trim().length === 0) {
    return res.status(400).json({ error: 'Request cannot be empty' });
  }
  
  lastRequest = request;
  permissionGranted = false;
  
  res.json({
    status: 'permission_requested',
    request,
    action: 'Capture Chrome browser window and extract all open tab links',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/approve-access
 * User grants permission, agent captures screen
 */
app.post('/api/approve-access', async (req, res) => {
  if (!lastRequest) {
    return res.status(400).json({ error: 'No pending request' });
  }
  
  permissionGranted = true;
  
  try {
    const result = await captureChromeTabs();
    
    // Immediately revoke access
    permissionGranted = false;
    lastRequest = null;
    
    res.json({
      status: 'access_granted_and_executed',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    permissionGranted = false;
    res.status(500).json({
      error: 'Capture failed',
      message: error.message
    });
  }
});

/**
 * POST /api/deny-access
 * User denies permission
 */
app.post('/api/deny-access', (req, res) => {
  permissionGranted = false;
  lastRequest = null;
  
  res.json({
    status: 'access_denied',
    timestamp: new Date().toISOString()
  });
});

/**
 * Capture Chrome tabs using Playwright
 * Returns list of open tabs with URLs
 */
async function captureChromeTabs() {
  let browser;
  
  try {
    // Connect to existing Chrome instance
    // Requires Chrome to be running with --remote-debugging-port=9222
    browser = await chromium.connectOverCDP('http://localhost:9222');
    
    const contexts = browser.contexts();
    const tabs = [];
    
    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        const title = await page.title();
        
        tabs.push({
          title: title || '(Untitled)',
          url: url,
          isActive: page === pages[0] // Simplified; real impl would track active tab
        });
      }
    }
    
    return {
      tabCount: tabs.length,
      tabs: tabs,
      capturedAt: new Date().toISOString(),
      accessRevoked: true // Immediate revocation after capture
    };
  } catch (error) {
    // Fallback: Launch a new browser instance (won't have user's tabs, but demonstrates capability)
    console.warn('Could not connect to existing Chrome. Error:', error.message);
    console.warn('To use RalphWang with your current tabs, start Chrome with:');
    console.warn('  google-chrome --remote-debugging-port=9222');
    
    return {
      error: 'Chrome not accessible',
      instruction: 'Start Chrome with --remote-debugging-port=9222 to enable tab capture',
      accessRevoked: true
    };
  }
}

/**
 * GET /api/status
 * Check current permission state
 */
app.get('/api/status', (req, res) => {
  res.json({
    permissionGranted,
    hasActiveRequest: !!lastRequest,
    lastRequest,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 fallback
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`\n🤖 RalphWang running at http://localhost:${PORT}`);
  console.log(`\n📋 To capture your Chrome tabs:`);
  console.log(`   1. Start Chrome: google-chrome --remote-debugging-port=9222`);
  console.log(`   2. Open http://localhost:${PORT}`);
  console.log(`   3. Request access → Grant permission`);
  console.log(`\n🔒 Security: Access only when explicitly granted, revoked immediately after use\n`);
});
