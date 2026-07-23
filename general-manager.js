/**
 * General Manager Agent
 * Orchestrates all sub-agents: RalphWang, FanDuel, Claude agents, etc.
 * Routes tasks, aggregates results, provides unified interface
 */

class GeneralManager {
  constructor() {
    this.agents = new Map();
    this.tasks = [];
    this.results = new Map();
    this.log = [];
  }

  /**
   * Register a sub-agent
   */
  registerAgent(name, agent) {
    this.agents.set(name, agent);
    this.logEntry(`✓ Registered agent: ${name}`, 'info');
  }

  /**
   * Route task to appropriate agent(s)
   */
  async routeTask(taskDescription, targetAgent = null) {
    this.logEntry(`→ Incoming task: ${taskDescription}`, 'task');
    
    if (targetAgent) {
      return this.delegateToAgent(targetAgent, taskDescription);
    }

    // Smart routing: analyze task and choose agent
    const agent = this.selectAgent(taskDescription);
    if (!agent) {
      this.logEntry(`⚠️ No suitable agent found for: ${taskDescription}`, 'warning');
      return null;
    }

    return this.delegateToAgent(agent, taskDescription);
  }

  /**
   * Delegate task to specific agent
   */
  async delegateToAgent(agentName, task) {
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      this.logEntry(`❌ Agent not found: ${agentName}`, 'error');
      return null;
    }

    this.logEntry(`→ Delegating to ${agentName}: ${task}`, 'delegate');

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

  /**
   * Execute coordinated multi-agent workflow
   */
  async executeWorkflow(workflow) {
    this.logEntry(`🔄 Starting workflow: ${workflow.name}`, 'workflow');

    const results = {};
    
    for (const step of workflow.steps) {
      this.logEntry(`  → Step: ${step.name}`, 'step');
      
      const result = await this.routeTask(step.task, step.agent);
      results[step.name] = result;

      if (step.waitFor) {
        await new Promise(resolve => setTimeout(resolve, step.waitFor));
      }
    }

    this.logEntry(`✓ Workflow complete: ${workflow.name}`, 'success');
    return results;
  }

  /**
   * Smart agent selection based on task keywords
   */
  selectAgent(taskDescription) {
    const desc = taskDescription.toLowerCase();

    if (desc.includes('tab') || desc.includes('screen') || desc.includes('browser')) {
      return this.agents.has('ralphwang') ? 'ralphwang' : null;
    }
    if (desc.includes('bet') || desc.includes('sport') || desc.includes('odds')) {
      return this.agents.has('fanduel') ? 'fanduel' : null;
    }
    if (desc.includes('html') || desc.includes('design') || desc.includes('web')) {
      return this.agents.has('html-anything') ? 'html-anything' : null;
    }
    if (desc.includes('code') || desc.includes('develop') || desc.includes('program')) {
      return this.agents.has('code-assistant') ? 'code-assistant' : null;
    }
    if (desc.includes('data') || desc.includes('analyze') || desc.includes('report')) {
      return this.agents.has('data-analyst') ? 'data-analyst' : null;
    }

    // Default to first available agent
    return this.agents.keys().next().value || null;
  }

  /**
   * Log entry with timestamp
   */
  logEntry(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, message, type };
    this.log.push(entry);
    console.log(`[${timestamp}] ${message}`);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.log;
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      agents: Array.from(this.agents.keys()),
      tasks: this.tasks.length,
      results: this.results.size,
      logs: this.log.length
    };
  }

  /**
   * Get results from specific agent
   */
  getResults(agentName) {
    const results = [];
    for (const [key, value] of this.results) {
      if (key.startsWith(agentName)) {
        results.push(value);
      }
    }
    return results;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneralManager;
}
