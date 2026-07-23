# RalphWang

Permission-gated screen access agent. Only looks when you ask.

**Security:** No persistent access, per-request approval, immediate revocation.

## Setup

```bash
npm install
google-chrome --remote-debugging-port=9222 &
npm start
# Open http://localhost:3000

mzarling86@penguin:~/ralph-wang$ cat > README.md << 'EOF'
# RalphWang

Permission-gated screen access agent. Only looks when you ask.

**Security:** No persistent access, per-request approval, immediate revocation.

## Setup

```bash
npm install
google-chrome --remote-debugging-port=9222 &
npm start
# Open http://localhost:3000
> 
> EOF

## Setup

```bash
npm install
google-chrome --remote-debugging-port=9222 &
npm start
# Open http://localhost:3000
> 
> mzarling86@penguin:~/ralph-wang$ cat > README.md << 'EOF'
# RalphWang

Permission-gated screen access agent. Only looks when you ask.

**Security:** No persistent access, per-request approval, immediate revocation.

## Setup

```bash
npm install
google-chrome --remote-debugging-port=9222 &
npm start
# Open http://localhost:3000
> 
> EOF
> cat > .gitignore << 'EOF'
node_modules/
.env
.DS_Store
*.log
.playwright/
