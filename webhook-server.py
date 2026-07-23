#!/usr/bin/env python3
"""
Webhook Server (Python)
HTTP API for the orchestrator system
Run: python3 webhook-server.py
Access: http://localhost:4000/api/request
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import time
from datetime import datetime
import threading

class GeneralManager:
    def __init__(self):
        self.agents = {}
        self.tasks = []
        self.results = {}
        self.log = []
    
    def register_agent(self, name, agent):
        self.agents[name] = agent
        self.log_entry(f"✓ Registered: {name}", "info")
    
    async def route_task(self, task_description, target_agent=None):
        self.log_entry(f"→ Task: {task_description}", "task")
        
        if target_agent:
            return self.delegate_to_agent(target_agent, task_description)
        
        agent = self.select_agent(task_description)
        if not agent:
            self.log_entry("⚠️ No agent found", "warning")
            return None
        
        return self.delegate_to_agent(agent, task_description)
    
    def delegate_to_agent(self, agent_name, task):
        if agent_name not in self.agents:
            self.log_entry(f"❌ Agent not found: {agent_name}", "error")
            return None
        
        agent = self.agents[agent_name]
        self.log_entry(f"→ Delegating to {agent_name}", "delegate")
        
        try:
            result = agent['execute'](task)
            self.results[f"{agent_name}_{int(time.time())}"] = result
            self.log_entry(f"✓ {agent_name} completed", "success")
            return result
        except Exception as e:
            self.log_entry(f"❌ {agent_name} failed: {str(e)}", "error")
            return None
    
    def select_agent(self, task_description):
        desc = task_description.lower()
        
        if 'tab' in desc or 'screen' in desc:
            return 'ralphwang'
        if 'bet' in desc or 'sport' in desc:
            return 'fanduel'
        if 'html' in desc or 'design' in desc:
            return 'html-anything'
        if 'code' in desc:
            return 'code-assistant'
        if 'data' in desc:
            return 'data-analyst'
        
        if self.agents:
            return list(self.agents.keys())[0]
        return None
    
    def log_entry(self, message, type_="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log.append({
            "timestamp": timestamp,
            "message": message,
            "type": type_
        })
    
    def get_status(self):
        return {
            "agents": list(self.agents.keys()),
            "task_count": len(self.tasks),
            "result_count": len(self.results),
            "log_count": len(self.log)
        }
    
    def get_logs(self):
        return self.log

class AssistantAgent:
    def __init__(self, general_manager):
        self.gm = general_manager
        self.context = []
    
    def handle_request(self, user_input):
        self.context.append({
            "role": "user",
            "content": user_input,
            "timestamp": datetime.now().isoformat()
        })
        
        intent = self.analyze_intent(user_input)
        result = None
        
        if intent['type'] == 'single_task':
            result = self.gm.route_task(intent['task'], intent.get('target_agent'))
        elif intent['type'] == 'query':
            result = self.handle_query(intent['query'])
        
        response = self.format_response(result, intent)
        
        self.context.append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return response
    
    def analyze_intent(self, input_text):
        lower = input_text.lower()
        
        if 'status' in lower or 'what' in lower or 'logs' in lower:
            return {'type': 'query', 'query': input_text}
        
        return {
            'type': 'single_task',
            'task': input_text,
            'target_agent': self.detect_target_agent(input_text)
        }
    
    def detect_target_agent(self, input_text):
        lower = input_text.lower()
        
        if 'ralph' in lower:
            return 'ralphwang'
        if 'fanduel' in lower:
            return 'fanduel'
        if 'html' in lower:
            return 'html-anything'
        
        return None
    
    def handle_query(self, query):
        lower = query.lower()
        
        if 'status' in lower:
            return self.gm.get_status()
        if 'logs' in lower:
            return self.gm.get_logs()
        if 'agent' in lower:
            return {
                "agents": list(self.gm.agents.keys()),
                "count": len(self.gm.agents)
            }
        
        return {"message": "Query received"}
    
    def format_response(self, result, intent):
        if not result:
            return "❌ No result"
        if isinstance(result, dict) and 'error' in result:
            return f"❌ Error: {result['error']}"
        return result

class Orchestrator:
    def __init__(self):
        self.gm = GeneralManager()
        self.assistant = AssistantAgent(self.gm)
        self.register_default_agents()
    
    def register_default_agents(self):
        self.gm.register_agent('ralphwang', {
            'name': 'RalphWang',
            'execute': lambda task: {
                'agent': 'RalphWang',
                'status': 'ready',
                'task': task,
                'capability': 'Screen capture, tab extraction'
            }
        })
        
        self.gm.register_agent('fanduel', {
            'name': 'FanDuel',
            'execute': lambda task: {
                'agent': 'FanDuel',
                'status': 'ready',
                'task': task,
                'capability': 'Betting analysis, odds monitoring'
            }
        })
        
        self.gm.register_agent('html-anything', {
            'name': 'HTML Anything',
            'execute': lambda task: {
                'agent': 'HTML Anything',
                'status': 'ready',
                'task': task,
                'capability': 'HTML generation, design'
            }
        })
        
        self.gm.register_agent('code-assistant', {
            'name': 'Code Assistant',
            'execute': lambda task: {
                'agent': 'Code Assistant',
                'status': 'ready',
                'task': task,
                'capability': 'Code generation, debugging'
            }
        })
        
        self.gm.register_agent('data-analyst', {
            'name': 'Data Analyst',
            'execute': lambda task: {
                'agent': 'Data Analyst',
                'status': 'ready',
                'task': task,
                'capability': 'Data analysis, visualization'
            }
        })
    
    def request(self, user_input):
        return self.assistant.handle_request(user_input)
    
    def get_status(self):
        return {
            "orchestrator": "running",
            "general_manager": self.gm.get_status(),
            "uptime": time.time(),
            "agents": list(self.gm.agents.keys())
        }
    
    def get_logs(self):
        return self.gm.get_logs()

# Global orchestrator instance
orchestrator = Orchestrator()

class WebhookHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        pathname = parsed_url.path
        query = parse_qs(parsed_url.query)
        
        self.send_header_cors()
        
        # GET /api/request?request=...
        if pathname == '/api/request':
            request_param = query.get('request', [None])[0]
            if not request_param:
                self.send_error_response(400, "Missing request parameter")
                return
            
            result = orchestrator.request(request_param)
            self.send_success_response({
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
            return
        
        # GET /api/status
        if pathname == '/api/status':
            self.send_success_response({
                "status": orchestrator.get_status()
            })
            return
        
        # GET /api/logs
        if pathname == '/api/logs':
            self.send_success_response({
                "logs": orchestrator.get_logs()
            })
            return
        
        # GET /
        if pathname == '/':
            self.send_success_response({
                "message": "Orchestrator Webhook API running",
                "endpoints": {
                    "POST /api/request": "Send request (body: {request: ...})",
                    "GET /api/request?request=...": "Send request via query",
                    "GET /api/status": "Get orchestrator status",
                    "GET /api/logs": "Get logs"
                },
                "agents": list(orchestrator.gm.agents.keys())
            })
            return
        
        self.send_error_response(404, "Not found")
    
    def do_POST(self):
        parsed_url = urlparse(self.path)
        pathname = parsed_url.path
        
        self.send_header_cors()
        
        # POST /api/request
        if pathname == '/api/request':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode('utf-8'))
                request_text = data.get('request') or data.get('message') or data.get('task')
                
                if not request_text:
                    self.send_error_response(400, "Missing request in body")
                    return
                
                result = orchestrator.request(request_text)
                self.send_success_response({
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                })
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON")
            except Exception as e:
                self.send_error_response(500, str(e))
            return
        
        self.send_error_response(404, "Not found")
    
    def send_header_cors(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_success_response(self, data):
        response = {
            "success": True,
            **data
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "success": False,
            "error": message
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def log_message(self, format, *args):
        pass  # Suppress default logging

if __name__ == '__main__':
    PORT = 4000
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, WebhookHandler)
    
    print('\n🤖 Orchestrator Webhook API')
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    print(f'✓ Running on http://localhost:{PORT}')
    print('\n📡 Endpoints:')
    print(f'  POST   http://localhost:{PORT}/api/request')
    print(f'  GET    http://localhost:{PORT}/api/request?request=...')
    print(f'  GET    http://localhost:{PORT}/api/status')
    print(f'  GET    http://localhost:{PORT}/api/logs\n')
    print('🤖 Ready to receive requests\n')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n✓ Server stopped')
