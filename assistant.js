/**
 * Assistant Agent
 * User-facing interface that communicates with General Manager
 * Handles natural language requests, formatting, and response aggregation
 */

class AssistantAgent {
  constructor(generalManager) {
    this.gm = generalManager;
    this.context = [];
    this.currentSession = null;
  }

  /**
   * Process user request and coordinate with General Manager
   */
  async handleRequest(userInput) {
    console.log(`\n🤖 Assistant: Processing request...`);
    console.log(`📝 User: "${userInput}"\n`);

    // Store in context
    this.context.push({
      role: 'user',
      content: userInput,
      timestamp: new Date()
    });

    // Analyze request intent
    const intent = this.analyzeIntent(userInput);
    console.log(`📊 Intent detected: ${intent.type}`);

    // Route to General Manager
    let result = null;
    
    if (intent.type === 'workflow') {
      result = await this.gm.executeWorkflow(intent.workflow);
    } else if (intent.type === 'single_task') {
      result = await this.gm.routeTask(intent.task, intent.targetAgent);
    } else if (intent.type === 'query') {
      result = this.handleQuery(intent.query);
    }

    // Format response
    const response = this.formatResponse(result, intent);
    
    // Store in context
    this.context.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return response;
  }

  /**
   * Analyze user intent
   */
  analyzeIntent(input) {
    const lower = input.toLowerCase();

    // Workflow detection
    if (lower.includes('workflow') || lower.includes('sequence') || lower.includes('then')) {
      return {
        type: 'workflow',
        workflow: this.parseWorkflow(input)
      };
    }

    // Query detection
    if (lower.includes('status') || lower.includes('what') || lower.includes('how')) {
      return {
        type: 'query',
        query: input
      };
    }

    // Single task
    return {
      type: 'single_task',
      task: input,
      targetAgent: this.detectTargetAgent(input)
    };
  }

  /**
   * Detect target agent from request
   */
  detectTargetAgent(input) {
    const lower = input.toLowerCase();
    
    if (lower.includes('ralph') || lower.includes('wang') || lower.includes('screen')) {
      return 'ralphwang';
    }
    if (lower.includes('fanduel') || lower.includes('bet') || lower.includes('sport')) {
      return 'fanduel';
    }
    if (lower.includes('html') || lower.includes('design')) {
      return 'html-anything';
    }
    
    return null;
  }

  /**
   * Parse workflow from natural language
   */
  parseWorkflow(input) {
    // Simplified workflow parsing
    return {
      name: 'Custom Workflow',
      steps: [
        {
          name: 'Step 1',
          task: input,
          agent: this.detectTargetAgent(input),
          waitFor: 1000
        }
      ]
    };
  }

  /**
   * Handle query requests
   */
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

    return { message: 'Query processed', input: query };
  }

  /**
   * Format response for user
   */
  formatResponse(result, intent) {
    if (!result) {
      return '❌ No result returned. Please check the agent status.';
    }

    if (intent.type === 'query') {
      return this.formatQueryResponse(result);
    }

    if (intent.type === 'workflow') {
      return this.formatWorkflowResponse(result);
    }

    return this.formatTaskResponse(result);
  }

  /**
   * Format task response
   */
  formatTaskResponse(result) {
    if (typeof result === 'string') {
      return `✓ ${result}`;
    }
    if (result.error) {
      return `❌ Error: ${result.error}`;
    }
    return `✓ Task completed:\n${JSON.stringify(result, null, 2)}`;
  }

  /**
   * Format workflow response
   */
  formatWorkflowResponse(results) {
    let response = '✓ Workflow completed:\n\n';
    for (const [step, result] of Object.entries(results)) {
      response += `  ${step}: ✓\n`;
    }
    return response;
  }

  /**
   * Format query response
   */
  formatQueryResponse(result) {
    if (result.agents) {
      return `Active agents (${result.count}):\n${result.agents.map(a => `  • ${a}`).join('\n')}`;
    }
    if (Array.isArray(result)) {
      return `Results:\n${result.map(r => `  • ${JSON.stringify(r)}`).join('\n')}`;
    }
    return JSON.stringify(result, null, 2);
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.context;
  }

  /**
   * Clear context
   */
  clearContext() {
    this.context = [];
    this.currentSession = null;
  }

  /**
   * Get General Manager status
   */
  getSystemStatus() {
    return {
      assistant: 'Ready',
      generalManager: this.gm.getStatus(),
      conversationLength: this.context.length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssistantAgent;
}
