# RalphWang

**Permission-gated screen access agent.** Captures your Chrome browser tabs, extracts links, reports findings. Only looks when you ask. No persistent access.

## Security Model

- ✅ **No persistent access** — Agent cannot see your screen unless you explicitly grant permission
- ✅ **Per-request approval** — Each capture requires your explicit "Grant Access" approval
- ✅ **Immediate revocation** — Access is revoked immediately after processing
- ✅ **Scope-limited** — Only captures what you requested
- ✅ **Data disposal** — Captured data is processed and discarded immediately

## Setup

### Local Development

```bash
# Clone this repo
git clone https://github.com/<your-username>/ralph-wang.git
cd ralph-wang

# Install dependencies
npm install

# Start Chrome with debugging enabled (required for tab capture)
google-chrome --remote-debugging-port=9222 &

# Start RalphWang server
npm start

# Open http://localhost:3000 in your browser
```

### Usage

1. **Describe your need** — Tell RalphWang what you want
   - Example: "Look at my Chrome tabs and give me all the links"

2. **Grant permission** — Review what it will do, click "Grant Access"
   - Shows exactly what it will capture
   - Shows when access will be revoked

3. **Receive findings** — Agent captures, extracts, reports
   - Lists all open Chrome tabs + URLs
   - Shows exactly what was captured
   - Automatically revokes access

4. **Share with Claude** — Copy the tab list into Claude for adding agents

## Deployment to GitHub Pages

```bash
# Build and deploy
npm run build
npm run deploy
```

Your RalphWang instance will be live at `https://<your-username>.github.io/ralph-wang/`

## Features

- 🎯 **Chrome tab extraction** — Reads all open tabs and their URLs
- 🔒 **Permission-gated** — No access without explicit approval
- 🖼️ **Live screenshot preview** — Shows what was captured
- 📋 **Link list export** — Copy all extracted links
- ⚡ **Real-time status** — Live feed of agent activity
- 🔄 **Revocation on completion** — Access automatically revoked after processing

## How It Works

```
You: "Get my Chrome tabs"
       ↓
RalphWang: "Here's what I'll do..." [permission dialog]
       ↓
You: ✓ Grant Access
       ↓
RalphWang: [Connects to Chrome via Playwright]
           [Extracts all open tabs]
           [Revokes access immediately]
       ↓
You: [See the list] → Copy to Claude → Add agents
```

## Tech Stack

- **Frontend** — Vanilla JS, CSS Grid, real-time status UI
- **Backend** — Express.js + Playwright (Chrome automation)
- **Deployment** — GitHub Pages (static frontend) + local Node backend
- **Security** — CORS, permission model, immediate revocation

## Requirements

- Node.js 16+
- Google Chrome (with `--remote-debugging-port=9222`)
- npm or yarn

## Topics

Add these topics to your repo for discoverability:
- `ai-agents`
- `screen-capture`
- `permission-gated`
- `browser-automation`
- `chrome-tabs`

## License

MIT

---

**Built with security-first design.** No background monitoring. No persistent access. You're in control.
