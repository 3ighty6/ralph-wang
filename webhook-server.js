/**
 * Webhook Server
 * HTTP API for the orchestrator system
 * Run: node webhook-server.js
 * Access: http://localhost:4000/api/request
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Include orchestrator (simplified version for server)
class GeneralManager {
  constructor() {
    this.agents = new Map();
    this.tasks = [];
    this.results = new Map();
    this.log = [];
  }

  registerAgent(name, agent) {
    this.agents.set(name, agent);
    this.logEntry(`✓ Registered: ${name}`, 'info');
  }

  async routeTask(taskDescription, targetAgent = null) {
    this.logEntry(`→ Task: ${taskDescription}`, 'task');
    
    if (targetAgent) {
      return this.delegateToAgent(targetAgent, taskDescription);
    }

    const agent = this.selectAgent(taskDescription);
    if (!agent) {
      this.logEntry(`⚠️ No agent found`, 'warning');
      return null;
    }

    return this.delegateToAgent(agent, taskDescription);
  }

  async delegateToAgent(agentName, task) {
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      this.logEntry(`❌ Agent not found: ${agentName}`, 'error');
      return null;
    }

    this.logEntry(`→ Delegating to ${agentName}`, 'delegate');

    try {
      const result = await agent.execute(task);
      this.results.set(`${agentName}_${Date.now()}`, result);
      this.logEntry(`✓ ${agentName} completed`, 'success');
      return result;
    } catch (error) {
      this.logEntry(`❌ ${agentName} failed: ${error.message}`, 'error');
      return null;
    }
  }

  selectAgent(taskDescription) {
    const desc = taskDescription.toLowerCase();

    if (desc.includes('tab') || desc.includes('screen')) return 'ralphwang';
    if (desc.includes('bet') || desc.includes('sport')) return 'fanduel';
    if (desc.includes('html') || desc.includes('design')) return 'html-anything';
    if (desc.includes('code')) return 'code-assistant';
    if (desc.includes('data')) return 'data-analyst';

    return this.agents.keys().next().value || null;
  }

  logEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.log.push({ timestamp, message, type });
  }

  getStatus() {
    return {
      agents: Array.from(this.agents.keys()),
      taskCount: this.tasks.length,
      resultCount: this.results.size,
      logCount: this.log.length
    };
  }

  getLogs() {
    return this.log;
  }
}

class AssistantAgent {
  constructor(generalManager) {
    this.gm = generalManager;
    this.context = [];
  }

  async handleRequest(userInput) {
    this.context.push({
      role: 'user',
      content: userInput,
      timestamp: new Date()
    });

    const intent = this.analyzeIntent(userInput);
    let result = null;

    if (intent.type === 'single_task') {
      result = await this.gm.routeTask(intent.task, intent.targetAgent);
    } else if (intent.type === 'query') {
      result = this.handleQuery(intent.query);
    }

    const response = this.formatResponse(result, intent);
    
    this.context.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return response;
  }

  analyzeIntent(input) {
    const lower = input.toLowerCase();

    if (lower.includes('status') || lower.includes('what') || lower.includes('logs')) {
      return { type: 'query', query: input };
    }

    return {
      type: 'single_task',
      task: input,
      targetAgent: this.detectTargetAgent(input)
    };
  }

  detectTargetAgent(input) {
    const lower = input.toLowerCase();
    
    if (lower.includes('ralph')) return 'ralphwang';
    if (lower.includes('fanduel')) return 'fanduel';
    if (lower.includes('html')) return 'html-anything';
    
    return null;
  }

  handleQuery(query) {
    const lower = query.toLowerCase();

    if (lower.includes('status')) {
      return this.gm.getStatus();
    }
    if (lower.includes('logs')) {
      return this.gm.getLogs();
    }
    if (lower.includes('agent')) {
      return {
        agents: Array.from(this.gm.agents.keys()),
        count: this.gm.agents.size
      };
    }

    return { message: 'Query received' };
  }

  formatResponse(result, intent) {
    if (!result) return '❌ No result';
    if (result.error) return `❌ Error: ${result.error}`;
    return result;
  }

  getContext() {
    return this.context;
  }
}

class Orchestrator {
  constructor() {
    this.gm = new GeneralManager();
    this.assistant = new AssistantAgent(this.gm);
    this.registerDefaultAgents();
  }

  registerDefaultAgents() {
    this.gm.registerAgent('ralphwang', {
      name: 'RalphWang',
      async execute(task) {
        return { 
          agent: 'RalphWang',
          status: 'ready',
          task: task,
          capability: 'Screen capture, tab extraction'
        };
      }
    });

    this.gm.registerAgent('fanduel', {
      name: 'FanDuel',
      async execute(task) {
        return {
          agent: 'FanDuel',
          status: 'ready',
          task: task,
          capability: 'Betting analysis, odds monitoring'
        };
      }
    });

    this.gm.registerAgent('html-anything', {
      name: 'HTML Anything',
      async execute(task) {
        return {
          agent: 'HTML Anything',
          status: 'ready',
          task: task,
          capability: 'HTML generation, design'
        };
      }
    });

    this.gm.registerAgent('code-assistant', {
      name: 'Code Assistant',
      async execute(task) {
        return {
          agent: 'Code Assistant',
          status: 'ready',
          task: task,
          capability: 'Code generation, debugging'
        };
      }
    });

    this.gm.registerAgent('data-analyst', {
      name: 'Data Analyst',
      async execute(task) {
        return {
          agent: 'Data Analyst',
          status: 'ready',
          task: task,
          capability: 'Data analysis, visualization'
        };
      }
    });
  }

  async request(userInput) {
    return this.assistant.handleRequest(userInput);
  }

  getStatus() {
    return {
      orchestrator: 'running',
      generalManager: this.gm.getStatus(),
      uptime: process.uptime(),
      memory: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  getLogs() {
    return this.gm.getLogs();
  }
}

// Create orchestrator instance
const orchestrator = new Orchestrator();

// HTTP Server
const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /api/request - Send request to orchestrator
  if (pathname === '/api/request' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await orchestrator.request(data.request || data.message || data.task);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
    return;
  }

  // GET /api/request - Send request via query param
  if (pathname === '/api/request' && req.method === 'GET') {
    try {
      const request = query.request || query.message || query.task;
      if (!request) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Missing request parameter'
        }));
        return;
      }

      const result = await orchestrator.request(request);
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        result: result,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(400);
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }

  // GET /api/status - Get orchestrator status
  if (pathname === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      status: orchestrator.getStatus()
    }));
    return;
  }

  // GET /api/logs - Get logs
  if (pathname === '/api/logs') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      logs: orchestrator.getLogs()
    }));
    return;
  }

  // GET / - Health check
  if (pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Orchestrator Webhook API running',
      endpoints: {
        'POST /api/request': 'Send request (body: {request: "..."})',
        'GET /api/request?request=...': 'Send request via query',
        'GET /api/status': 'Get orchestrator status',
        'GET /api/logs': 'Get logs'
      },
      agents: Array.from(orchestrator.gm.agents.keys())
    }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    error: 'Not found'
  }));
});

server.listen(PORT, () => {
  console.log(`\n🤖 Orchestrator Webhook API`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✓ Running on http://localhost:${PORT}`);
  console.log(`\n📡 Endpoints:`);
  console.log(`  POST   http://localhost:${PORT}/api/request`);
  console.log(`  GET    http://localhost:${PORT}/api/request?request=...`);
  console.log(`  GET    http://localhost:${PORT}/api/status`);
  console.log(`  GET    http://localhost:${PORT}/api/logs\n`);
  console.log(`🤖 Ready to receive requests\n`);
});
