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

app.post('/api/approve-access', async (req, res) => {
  if (!lastRequest) {
    return res.status(400).json({ error: 'No pending request' });
  }
  
  permissionGranted = true;
  try {
    const result = await captureChromeTabs();
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

app.post('/api/deny-access', (req, res) => {
  permissionGranted = false;
  lastRequest = null;
  res.json({
    status: 'access_denied',
    timestamp: new Date().toISOString()
  });
});

async function captureChromeTabs() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    const tabs = [];
    
    for (const context of contexts) {
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        const title = await page.title();
        tabs.push({
          title: title || '(Untitled)',
          url: url
        });
      }
    }
    
    return {
      tabCount: tabs.length,
      tabs: tabs,
      capturedAt: new Date().toISOString(),
      accessRevoked: true
    };
  } catch (error) {
    console.warn('Chrome not accessible. Error:', error.message);
    return {
      error: 'Chrome not accessible',
      instruction: 'Start Chrome with --remote-debugging-port=9222',
      accessRevoked: true
    };
  }
}

app.get('/api/status', (req, res) => {
  res.json({
    permissionGranted,
    hasActiveRequest: !!lastRequest,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n🤖 RalphWang running at http://localhost:${PORT}`);
  console.log(`\n📋 To capture your Chrome tabs:`);
  console.log(`   1. Start Chrome: google-chrome --remote-debugging-port=9222`);
  console.log(`   2. Open http://localhost:${PORT}`);
  console.log(`   3. Request access → Grant permission\n`);
});
