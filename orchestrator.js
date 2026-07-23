/**
 * Orchestrator
 * Central hub that ties General Manager + Assistant + all sub-agents together
 * Provides unified API for the entire agent ecosystem
 */

class Orchestrator {
  constructor() {
    this.gm = null;
    this.assistant = null;
    this.agents = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the orchestrator
   */
  async init() {
    console.log('🚀 Initializing Orchestrator...\n');

    // Create General Manager
    this.gm = new GeneralManager();
    console.log('✓ General Manager created');

    // Create Assistant
    this.assistant = new AssistantAgent(this.gm);
    console.log('✓ Assistant created\n');

    // Register all available agents
    await this.registerDefaultAgents();

    this.initialized = true;
    console.log('\n✓ Orchestrator ready\n');
  }

  /**
   * Register default agents
   */
  async registerDefaultAgents() {
    console.log('📋 Registering agents...\n');

    // RalphWang - Screen/Tab Agent
    this.gm.registerAgent('ralphwang', {
      name: 'RalphWang',
      type: 'screen-capture',
      async execute(task) {
        console.log(`  → RalphWang executing: ${task}`);
        return { 
          agent: 'RalphWang',
          status: 'ready',
          capability: 'Screen capture, tab extraction, browser automation'
        };
      }
    });

    // FanDuel - Sports Betting Agent
    this.gm.registerAgent('fanduel', {
      name: 'FanDuel',
      type: 'betting',
      async execute(task) {
        console.log(`  → FanDuel executing: ${task}`);
        return {
          agent: 'FanDuel',
          status: 'ready',
          capability: 'Live odds, spread analysis, statistical edge detection'
        };
      }
    });

    // HTML Anything - Design Agent
    this.gm.registerAgent('html-anything', {
      name: 'HTML Anything',
      type: 'design',
      async execute(task) {
        console.log(`  → HTML Anything executing: ${task}`);
        return {
          agent: 'HTML Anything',
          status: 'ready',
          capability: 'HTML generation, design, web prototypes (75 skills)'
        };
      }
    });

    // Code Assistant
    this.gm.registerAgent('code-assistant', {
      name: 'Code Assistant',
      type: 'development',
      async execute(task) {
        console.log(`  → Code Assistant executing: ${task}`);
        return {
          agent: 'Code Assistant',
          status: 'ready',
          capability: 'Code generation, debugging, review'
        };
      }
    });

    // Data Analyst
    this.gm.registerAgent('data-analyst', {
      name: 'Data Analyst',
      type: 'analysis',
      async execute(task) {
        console.log(`  → Data Analyst executing: ${task}`);
        return {
          agent: 'Data Analyst',
          status: 'ready',
          capability: 'Data analysis, visualization, reporting'
        };
      }
    });

    console.log('✓ All agents registered\n');
  }

  /**
   * User-facing API - send request
   */
  async request(userInput) {
    if (!this.initialized) {
      await this.init();
    }

    return this.assistant.handleRequest(userInput);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      orchestrator: 'running',
      generalManager: this.gm?.getStatus(),
      assistant: this.assistant?.getSystemStatus(),
      agents: Array.from(this.gm?.agents.keys() || [])
    };
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.assistant?.getConversationHistory();
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflow) {
    if (!this.initialized) await this.init();
    return this.gm.executeWorkflow(workflow);
  }

  /**
   * Get logs
   */
  getLogs() {
    return this.gm?.getLogs();
  }
}

// Global orchestrator instance
let globalOrchestrator = null;

/**
 * Get or create orchestrator
 */
async function getOrchestrator() {
  if (!globalOrchestrator) {
    globalOrchestrator = new Orchestrator();
    await globalOrchestrator.init();
  }
  return globalOrchestrator;
}

/**
 * Send request to orchestrator
 */
async function request(userInput) {
  const orch = await getOrchestrator();
  return orch.request(userInput);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Orchestrator, getOrchestrator, request };
}
