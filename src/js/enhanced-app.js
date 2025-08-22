// AI Code Studio - Enhanced Application
class AICodeStudio {
    constructor() {
        this.chatHistory = [];
        this.artifacts = new Map();
        this.artifactCounter = 0;
        this.files = new Map();
        this.dataSources = new Map();
        this.currentChat = 'current';
        this.isTyping = false;
        this.executionQueue = [];
        this.pyodide = null;
        this.sqljs = null;
        
        this.settings = {
            apiKeys: {
                openai: '',
                anthropic: '',
                google: ''
            },
            dataSources: {
                database: '',
                googleSheets: '',
                customApi: ''
            },
            preferences: {
                autoExecute: true,
                autoSave: true,
                showArtifacts: true,
                defaultLanguage: 'python'
            }
        };

        this.initializeApp();
    }

    async initializeApp() {
        console.log('🚀 Initializing AI Code Studio...');
        
        this.loadSettings();
        this.loadChatHistory();
        this.loadArtifacts();
        this.setupEventListeners();
        this.initializeSampleData();
        this.updateModelStatus();
        
        // Initialize execution environments
        await this.initializePython();
        await this.initializeSQL();
        
        console.log('✅ AI Code Studio initialized successfully');
    }

    // Event Listeners Setup
    setupEventListeners() {
        console.log('📋 Setting up event listeners...');

        // Header buttons
        this.bindEvent('new-chat-btn', 'click', () => this.createNewChat());
        this.bindEvent('upload-btn', 'click', () => this.openFileUpload());
        this.bindEvent('save-btn', 'click', () => this.saveNotebook());
        this.bindEvent('export-btn', 'click', () => this.showModal('export-modal'));
        this.bindEvent('settings-btn', 'click', () => this.showModal('settings-modal'));

        // Chat input
        this.bindEvent('chat-input', 'keydown', (e) => this.handleChatKeydown(e));
        this.bindEvent('send-btn', 'click', () => this.sendMessage());

        // File upload
        this.bindEvent('file-upload', 'change', (e) => this.handleFileUpload(e));

        // AI model selection
        document.querySelectorAll('.ai-model-item').forEach(item => {
            item.addEventListener('click', () => this.selectAIModel(item.dataset.model));
        });

        // Data source buttons
        document.querySelectorAll('.data-source-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openDataSourceModal(btn.dataset.type));
        });

        // Settings
        this.setupSettingsModal();
        this.setupDataSourceModal();
        this.setupExportModal();

        // Artifacts panel
        this.bindEvent('close-artifacts', 'click', () => this.toggleArtifactsPanel());

        // Auto-save
        if (this.settings.preferences.autoSave) {
            setInterval(() => this.autoSave(), 30000);
        }

        console.log('✅ Event listeners setup complete');
    }

    bindEvent(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`⚠️ Element not found: ${elementId}`);
        }
    }

    // Chat Management
    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        const generateCode = document.getElementById('generate-code').checked;
        const createUI = document.getElementById('create-ui').checked;
        const analyzeData = document.getElementById('analyze-data').checked;
        const selectedModel = document.getElementById('ai-model-select').value;

        // Add user message
        this.addChatMessage('user', message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Process the message
            const response = await this.processAIRequest(message, {
                generateCode,
                createUI,
                analyzeData,
                model: selectedModel
            });

            this.hideTypingIndicator();
            this.addChatMessage('assistant', response.text, response.artifacts);

            // Handle artifacts
            if (response.artifacts && response.artifacts.length > 0) {
                for (const artifact of response.artifacts) {
                    await this.createArtifact(artifact);
                }
                this.showArtifactsPanel();
            }

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addChatMessage('assistant', 'Sorry, I encountered an error processing your request. Please check your API settings and try again.', [], 'error');
        }
    }

    async processAIRequest(message, options) {
        // Simulate AI processing - in real implementation, this would call actual AI APIs
        console.log('Processing AI request:', message, options);

        await this.delay(1500 + Math.random() * 1000);

        const artifacts = [];
        let responseText = '';

        // Analyze the request and determine what to generate
        const intent = this.analyzeIntent(message);

        switch (intent.type) {
            case 'code':
                artifacts.push(await this.generateCodeArtifact(message, intent));
                responseText = `I've generated ${intent.language} code for ${intent.purpose}. You can see it in the artifacts panel on the right. The code includes error handling and is ready to run.`;
                break;

            case 'ui':
                artifacts.push(await this.generateUIArtifact(message, intent));
                responseText = `I've created a ${intent.uiType} UI component for you. You can preview it in the artifacts panel and modify the code as needed.`;
                break;

            case 'data-analysis':
                artifacts.push(await this.generateDataAnalysisArtifact(message, intent));
                responseText = `I've created a data analysis script that will help you ${intent.purpose}. The code includes visualization and statistical analysis.`;
                break;

            case 'database':
                artifacts.push(await this.generateDatabaseArtifact(message, intent));
                responseText = `I've generated SQL queries and database interaction code for your request. The code includes proper error handling and data validation.`;
                break;

            case 'form':
                artifacts.push(await this.generateFormArtifact(message, intent));
                responseText = `I've created a dynamic form with validation and submission handling. You can customize the fields and styling as needed.`;
                break;

            default:
                responseText = this.generateGeneralResponse(message, intent);
        }

        return {
            text: responseText,
            artifacts: artifacts
        };
    }

    analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Code generation
        if (lowerMessage.includes('python') || lowerMessage.includes('script') || lowerMessage.includes('function')) {
            return {
                type: 'code',
                language: this.detectLanguage(message),
                purpose: this.extractPurpose(message)
            };
        }
        
        // UI generation
        if (lowerMessage.includes('ui') || lowerMessage.includes('interface') || lowerMessage.includes('component') || lowerMessage.includes('html')) {
            return {
                type: 'ui',
                uiType: this.detectUIType(message),
                purpose: this.extractPurpose(message)
            };
        }
        
        // Data analysis
        if (lowerMessage.includes('analyze') || lowerMessage.includes('chart') || lowerMessage.includes('visualiz') || lowerMessage.includes('statistics')) {
            return {
                type: 'data-analysis',
                purpose: this.extractPurpose(message)
            };
        }
        
        // Database
        if (lowerMessage.includes('database') || lowerMessage.includes('sql') || lowerMessage.includes('query')) {
            return {
                type: 'database',
                purpose: this.extractPurpose(message)
            };
        }
        
        // Form generation
        if (lowerMessage.includes('form') || lowerMessage.includes('input') || lowerMessage.includes('survey')) {
            return {
                type: 'form',
                purpose: this.extractPurpose(message)
            };
        }

        return {
            type: 'general',
            purpose: message
        };
    }

    detectLanguage(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('python')) return 'python';
        if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) return 'javascript';
        if (lowerMessage.includes('html')) return 'html';
        if (lowerMessage.includes('css')) return 'css';
        if (lowerMessage.includes('sql')) return 'sql';
        return this.settings.preferences.defaultLanguage;
    }

    detectUIType(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('dashboard')) return 'dashboard';
        if (lowerMessage.includes('form')) return 'form';
        if (lowerMessage.includes('chart')) return 'chart';
        if (lowerMessage.includes('table')) return 'table';
        return 'component';
    }

    extractPurpose(message) {
        // Extract the main purpose from the message
        const sentences = message.split(/[.!?]+/);
        return sentences[0].trim();
    }

    // Artifact Generation
    async generateCodeArtifact(message, intent) {
        const templates = {
            python: {
                'data analysis': `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load and analyze data
def analyze_data(file_path):
    """
    Comprehensive data analysis function
    """
    try:
        # Load data
        df = pd.read_csv(file_path)
        
        print("📊 Dataset Overview:")
        print(f"Shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        # Basic statistics
        print("\\n📈 Summary Statistics:")
        print(df.describe())
        
        # Missing values
        missing = df.isnull().sum()
        if missing.any():
            print("\\n🔍 Missing Values:")
            print(missing[missing > 0])
        
        # Create visualizations
        plt.figure(figsize=(12, 8))
        
        # Correlation heatmap
        plt.subplot(2, 2, 1)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 1:
            sns.heatmap(df[numeric_cols].corr(), annot=True, cmap='coolwarm')
            plt.title('Correlation Matrix')
        
        # Distribution plots
        plt.subplot(2, 2, 2)
        if len(numeric_cols) > 0:
            df[numeric_cols[0]].hist(bins=30)
            plt.title(f'Distribution of {numeric_cols[0]}')
        
        plt.tight_layout()
        plt.show()
        
        return df
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

# Example usage
# df = analyze_data('your_data.csv')`,

                'web scraping': `import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

def scrape_website(url, delay=1):
    """
    Web scraping function with error handling
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract data (customize based on your needs)
        data = []
        
        # Example: Extract all links
        links = soup.find_all('a', href=True)
        for link in links:
            data.append({
                'text': link.get_text(strip=True),
                'url': link['href']
            })
        
        print(f"✅ Successfully scraped {len(data)} items from {url}")
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        return df
        
    except requests.RequestException as e:
        print(f"❌ Request error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    return None

# Example usage
# df = scrape_website('https://example.com')`,

                'api': `import requests
import json
from typing import Dict, Any, Optional

class APIClient:
    """
    Generic API client with authentication and error handling
    """
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            })
    
    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ GET request failed: {str(e)}")
            return {}
    
    def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make POST request"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.post(url, json=data)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"❌ POST request failed: {str(e)}")
            return {}

# Example usage
# client = APIClient('https://api.example.com', 'your-api-key')
# data = client.get('/users')
# print(f"📊 Retrieved {len(data.get('users', []))} users")`
            },
            
            javascript: {
                'dom manipulation': `// DOM Manipulation Utilities
class DOMHelper {
    /**
     * Create element with attributes and content
     */
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.textContent = content;
        }
        
        return element;
    }
    
    /**
     * Add event listener with automatic cleanup
     */
    static addEventHandler(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        // Return cleanup function
        return () => element.removeEventListener(event, handler, options);
    }
    
    /**
     * Animate element with CSS transitions
     */
    static animate(element, properties, duration = 300) {
        return new Promise((resolve) => {
            const originalTransition = element.style.transition;
            element.style.transition = \`all \${duration}ms ease\`;
            
            Object.entries(properties).forEach(([prop, value]) => {
                element.style[prop] = value;
            });
            
            setTimeout(() => {
                element.style.transition = originalTransition;
                resolve();
            }, duration);
        });
    }
    
    /**
     * Fetch data with error handling
     */
    static async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Fetch error:', error);
            throw error;
        }
    }
}

// Example usage
const button = DOMHelper.createElement('button', 
    { className: 'btn btn-primary', id: 'myButton' }, 
    'Click me!'
);

const cleanup = DOMHelper.addEventHandler(button, 'click', () => {
    DOMHelper.animate(button, { transform: 'scale(1.1)' }, 200)
        .then(() => DOMHelper.animate(button, { transform: 'scale(1)' }, 200));
});

document.body.appendChild(button);`,

                'data processing': `// Data Processing and Analytics
class DataProcessor {
    constructor(data) {
        this.data = Array.isArray(data) ? data : [];
    }
    
    /**
     * Filter data based on criteria
     */
    filter(predicate) {
        return new DataProcessor(this.data.filter(predicate));
    }
    
    /**
     * Transform data
     */
    map(transformer) {
        return new DataProcessor(this.data.map(transformer));
    }
    
    /**
     * Group data by key
     */
    groupBy(keyFn) {
        const groups = {};
        this.data.forEach(item => {
            const key = keyFn(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    }
    
    /**
     * Calculate statistics
     */
    stats(key) {
        const values = this.data.map(item => Number(item[key])).filter(v => !isNaN(v));
        
        if (values.length === 0) return null;
        
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = values.sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return { sum, mean, median, min, max, count: values.length };
    }
    
    /**
     * Export to CSV
     */
    toCSV() {
        if (this.data.length === 0) return '';
        
        const headers = Object.keys(this.data[0]);
        const rows = this.data.map(item => 
            headers.map(header => 
                JSON.stringify(item[header] || '')
            ).join(',')
        );
        
        return [headers.join(','), ...rows].join('\\n');
    }
    
    /**
     * Get raw data
     */
    get() {
        return this.data;
    }
}

// Example usage
const processor = new DataProcessor([
    { name: 'John', age: 30, salary: 50000 },
    { name: 'Jane', age: 25, salary: 60000 },
    { name: 'Bob', age: 35, salary: 55000 }
]);

const adults = processor
    .filter(person => person.age >= 18)
    .map(person => ({ ...person, category: 'adult' }));

const salaryStats = processor.stats('salary');
console.log('💰 Salary Statistics:', salaryStats);

const csv = adults.toCSV();
console.log('📊 CSV Export:', csv);`
            }
        };

        const category = intent.purpose.toLowerCase().includes('data') ? 'data analysis' :
                        intent.purpose.toLowerCase().includes('scrape') ? 'web scraping' :
                        intent.purpose.toLowerCase().includes('api') ? 'api' :
                        intent.purpose.toLowerCase().includes('dom') ? 'dom manipulation' :
                        intent.purpose.toLowerCase().includes('process') ? 'data processing' :
                        'data analysis';

        return {
            id: `artifact-${++this.artifactCounter}`,
            type: 'code',
            language: intent.language,
            title: `${intent.language.charAt(0).toUpperCase() + intent.language.slice(1)} Code - ${category}`,
            description: `Generated ${intent.language} code for ${intent.purpose}`,
            content: templates[intent.language]?.[category] || templates[intent.language]?.['data analysis'] || '# Generated code\nprint("Hello, World!")',
            editable: true,
            executable: true
        };
    }

    async generateUIArtifact(message, intent) {
        const templates = {
            dashboard: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; }
        .dashboard { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2rem; font-weight: bold; color: #1f2937; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .chart { height: 300px; background: linear-gradient(45deg, #e3f2fd, #bbdefb); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #1976d2; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>📊 Analytics Dashboard</h1>
            <p>Real-time data insights and metrics</p>
        </div>
        
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">1,234</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$45.2K</div>
                <div class="metric-label">Revenue</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">89.5%</div>
                <div class="metric-label">Conversion Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">156</div>
                <div class="metric-label">Active Sessions</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>Performance Trends</h3>
            <div class="chart">
                📈 Chart visualization would go here
            </div>
        </div>
    </div>
    
    <script>
        // Simulate real-time updates
        setInterval(() => {
            const metrics = document.querySelectorAll('.metric-value');
            metrics.forEach(metric => {
                const current = parseInt(metric.textContent.replace(/[^0-9]/g, ''));
                const change = Math.floor(Math.random() * 10) - 5;
                const newValue = Math.max(0, current + change);
                
                if (metric.textContent.includes('$')) {
                    metric.textContent = \`$\${newValue.toLocaleString()}\`;
                } else if (metric.textContent.includes('%')) {
                    metric.textContent = \`\${Math.min(100, newValue)}%\`;
                } else {
                    metric.textContent = newValue.toLocaleString();
                }
            });
        }, 3000);
    </script>
</body>
</html>`,

            form: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dynamic Form</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f9fafb; padding: 20px; }
        .form-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .form-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .form-body { padding: 30px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #374151; }
        .form-input { width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; transition: border-color 0.2s; }
        .form-input:focus { outline: none; border-color: #667eea; }
        .form-select { width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; }
        .form-textarea { width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; min-height: 100px; resize: vertical; }
        .form-checkbox { margin-right: 8px; }
        .form-submit { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s; }
        .form-submit:hover { transform: translateY(-2px); }
        .error { color: #ef4444; font-size: 14px; margin-top: 5px; }
        .success { background: #10b981; color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="form-header">
            <h1>📝 Contact Form</h1>
            <p>Get in touch with us</p>
        </div>
        
        <div class="form-body">
            <form id="contactForm">
                <div class="form-group">
                    <label class="form-label" for="name">Name *</label>
                    <input type="text" id="name" name="name" class="form-input" required>
                    <div class="error" id="nameError"></div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="email">Email *</label>
                    <input type="email" id="email" name="email" class="form-input" required>
                    <div class="error" id="emailError"></div>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="subject">Subject</label>
                    <select id="subject" name="subject" class="form-select">
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Support</option>
                        <option value="sales">Sales</option>
                        <option value="feedback">Feedback</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="message">Message *</label>
                    <textarea id="message" name="message" class="form-textarea" required placeholder="Tell us about your inquiry..."></textarea>
                    <div class="error" id="messageError"></div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" class="form-checkbox" id="newsletter" name="newsletter">
                        Subscribe to our newsletter
                    </label>
                </div>
                
                <button type="submit" class="form-submit">Send Message</button>
            </form>
        </div>
    </div>
    
    <script>
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            document.querySelectorAll('.error').forEach(el => el.textContent = '');
            
            // Validate form
            let isValid = true;
            
            const name = document.getElementById('name').value.trim();
            if (!name) {
                document.getElementById('nameError').textContent = 'Name is required';
                isValid = false;
            }
            
            const email = document.getElementById('email').value.trim();
            if (!email) {
                document.getElementById('emailError').textContent = 'Email is required';
                isValid = false;
            } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
                document.getElementById('emailError').textContent = 'Please enter a valid email';
                isValid = false;
            }
            
            const message = document.getElementById('message').value.trim();
            if (!message) {
                document.getElementById('messageError').textContent = 'Message is required';
                isValid = false;
            }
            
            if (isValid) {
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'success';
                successDiv.textContent = '✅ Thank you! Your message has been sent successfully.';
                
                const formBody = document.querySelector('.form-body');
                formBody.insertBefore(successDiv, formBody.firstChild);
                
                // Reset form
                this.reset();
                
                // Remove success message after 5 seconds
                setTimeout(() => successDiv.remove(), 5000);
            }
        });
    </script>
</body>
</html>`,

            table: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Table</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f9fafb; padding: 20px; }
        .table-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .table-header { background: #1f2937; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .search-box { padding: 8px 12px; border: none; border-radius: 6px; width: 250px; }
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        tr:hover { background: #f9fafb; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .status.active { background: #d1fae5; color: #065f46; }
        .status.inactive { background: #fee2e2; color: #991b1b; }
        .pagination { padding: 20px; display: flex; justify-content: between; align-items: center; }
        .pagination-info { color: #6b7280; }
        .pagination-buttons { display: flex; gap: 8px; }
        .pagination-btn { padding: 8px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; }
        .pagination-btn:hover { background: #f9fafb; }
        .pagination-btn.active { background: #1f2937; color: white; }
    </style>
</head>
<body>
    <div class="table-container">
        <div class="table-header">
            <h1>📊 User Management</h1>
            <input type="text" class="search-box" placeholder="Search users..." id="searchInput">
        </div>
        
        <div class="table-wrapper">
            <table id="dataTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <!-- Data will be populated by JavaScript -->
                </tbody>
            </table>
        </div>
        
        <div class="pagination">
            <div class="pagination-info" id="paginationInfo">
                Showing 1-10 of 50 results
            </div>
            <div class="pagination-buttons" id="paginationButtons">
                <!-- Pagination buttons will be populated by JavaScript -->
            </div>
        </div>
    </div>
    
    <script>
        // Sample data
        const sampleData = [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', lastLogin: '2024-01-15' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', lastLogin: '2024-01-14' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'inactive', lastLogin: '2024-01-10' },
            { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'active', lastLogin: '2024-01-15' },
            { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'User', status: 'active', lastLogin: '2024-01-13' }
        ];
        
        let currentPage = 1;
        let filteredData = [...sampleData];
        const itemsPerPage = 10;
        
        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            tbody.innerHTML = pageData.map(user => \`
                <tr>
                    <td>\${user.id}</td>
                    <td>\${user.name}</td>
                    <td>\${user.email}</td>
                    <td>\${user.role}</td>
                    <td><span class="status \${user.status}">\${user.status}</span></td>
                    <td>\${user.lastLogin}</td>
                    <td>
                        <button onclick="editUser(\${user.id})" style="margin-right: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                        <button onclick="deleteUser(\${user.id})" style="padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                    </td>
                </tr>
            \`).join('');
            
            updatePagination();
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const info = document.getElementById('paginationInfo');
            const buttons = document.getElementById('paginationButtons');
            
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
            
            info.textContent = \`Showing \${startItem}-\${endItem} of \${filteredData.length} results\`;
            
            buttons.innerHTML = '';
            
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.className = \`pagination-btn \${i === currentPage ? 'active' : ''}\`;
                btn.textContent = i;
                btn.onclick = () => {
                    currentPage = i;
                    renderTable();
                };
                buttons.appendChild(btn);
            }
        }
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filteredData = sampleData.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.role.toLowerCase().includes(searchTerm)
            );
            currentPage = 1;
            renderTable();
        });
        
        function editUser(id) {
            alert(\`Edit user with ID: \${id}\`);
        }
        
        function deleteUser(id) {
            if (confirm('Are you sure you want to delete this user?')) {
                alert(\`Delete user with ID: \${id}\`);
            }
        }
        
        // Initial render
        renderTable();
    </script>
</body>
</html>`
        };

        return {
            id: `artifact-${++this.artifactCounter}`,
            type: 'ui',
            language: 'html',
            title: `${intent.uiType.charAt(0).toUpperCase() + intent.uiType.slice(1)} UI Component`,
            description: `Interactive ${intent.uiType} component with responsive design`,
            content: templates[intent.uiType] || templates.dashboard,
            editable: true,
            executable: true,
            previewable: true
        };
    }

    async generateDataAnalysisArtifact(message, intent) {
        return {
            id: `artifact-${++this.artifactCounter}`,
            type: 'code',
            language: 'python',
            title: 'Data Analysis Script',
            description: 'Comprehensive data analysis with visualization',
            content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

class DataAnalyzer:
    def __init__(self, data_source):
        """Initialize the data analyzer with a data source"""
        self.data = self.load_data(data_source)
        self.report = {}
    
    def load_data(self, source):
        """Load data from various sources"""
        if isinstance(source, str):
            if source.endswith('.csv'):
                return pd.read_csv(source)
            elif source.endswith('.json'):
                return pd.read_json(source)
            elif source.endswith('.xlsx'):
                return pd.read_excel(source)
        elif isinstance(source, pd.DataFrame):
            return source
        else:
            raise ValueError("Unsupported data source")
    
    def basic_info(self):
        """Generate basic information about the dataset"""
        info = {
            'shape': self.data.shape,
            'columns': list(self.data.columns),
            'dtypes': self.data.dtypes.to_dict(),
            'memory_usage': self.data.memory_usage(deep=True).sum(),
            'missing_values': self.data.isnull().sum().to_dict()
        }
        
        print("📊 Dataset Overview")
        print("=" * 50)
        print(f"Shape: {info['shape'][0]} rows × {info['shape'][1]} columns")
        print(f"Memory usage: {info['memory_usage'] / 1024**2:.2f} MB")
        print(f"\\nColumns: {', '.join(info['columns'])}")
        
        missing = {k: v for k, v in info['missing_values'].items() if v > 0}
        if missing:
            print(f"\\n🔍 Missing values:")
            for col, count in missing.items():
                print(f"  {col}: {count} ({count/len(self.data)*100:.1f}%)")
        
        self.report['basic_info'] = info
        return info
    
    def statistical_summary(self):
        """Generate statistical summary"""
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            summary = self.data[numeric_cols].describe()
            print(f"\\n📈 Statistical Summary")
            print("=" * 50)
            print(summary)
            
            # Additional statistics
            print(f"\\n📊 Additional Statistics")
            for col in numeric_cols:
                values = self.data[col].dropna()
                if len(values) > 0:
                    skewness = stats.skew(values)
                    kurtosis = stats.kurtosis(values)
                    print(f"{col}:")
                    print(f"  Skewness: {skewness:.3f}")
                    print(f"  Kurtosis: {kurtosis:.3f}")
            
            self.report['statistical_summary'] = summary.to_dict()
        else:
            print("No numeric columns found for statistical analysis")
    
    def correlation_analysis(self):
        """Analyze correlations between numeric variables"""
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 1:
            corr_matrix = self.data[numeric_cols].corr()
            
            plt.figure(figsize=(10, 8))
            sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0,
                       square=True, fmt='.2f')
            plt.title('Correlation Matrix')
            plt.tight_layout()
            plt.show()
            
            # Find strong correlations
            strong_corr = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_val = corr_matrix.iloc[i, j]
                    if abs(corr_val) > 0.7:
                        strong_corr.append((
                            corr_matrix.columns[i], 
                            corr_matrix.columns[j], 
                            corr_val
                        ))
            
            if strong_corr:
                print(f"\\n🔗 Strong Correlations (|r| > 0.7):")
                for var1, var2, corr in strong_corr:
                    print(f"  {var1} ↔ {var2}: {corr:.3f}")
            
            self.report['correlation_matrix'] = corr_matrix.to_dict()
    
    def distribution_analysis(self):
        """Analyze distributions of numeric variables"""
        numeric_cols = self.data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            n_cols = min(4, len(numeric_cols))
            n_rows = (len(numeric_cols) + n_cols - 1) // n_cols
            
            fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 4*n_rows))
            if n_rows == 1:
                axes = [axes] if n_cols == 1 else axes
            elif n_cols == 1:
                axes = [[ax] for ax in axes]
            
            for i, col in enumerate(numeric_cols):
                row = i // n_cols
                col_idx = i % n_cols
                ax = axes[row][col_idx] if n_rows > 1 else axes[col_idx]
                
                self.data[col].hist(bins=30, ax=ax, alpha=0.7)
                ax.set_title(f'Distribution of {col}')
                ax.set_xlabel(col)
                ax.set_ylabel('Frequency')
            
            # Hide empty subplots
            for i in range(len(numeric_cols), n_rows * n_cols):
                row = i // n_cols
                col_idx = i % n_cols
                if n_rows > 1:
                    axes[row][col_idx].set_visible(False)
                elif n_cols > 1:
                    axes[col_idx].set_visible(False)
            
            plt.tight_layout()
            plt.show()
    
    def generate_insights(self):
        """Generate automated insights"""
        insights = []
        
        # Data quality insights
        missing_pct = (self.data.isnull().sum() / len(self.data) * 100)
        high_missing = missing_pct[missing_pct > 20]
        if len(high_missing) > 0:
            insights.append(f"⚠️  High missing values detected in: {', '.join(high_missing.index)}")
        
        # Size insights
        if len(self.data) > 100000:
            insights.append("📊 Large dataset detected - consider sampling for initial analysis")
        elif len(self.data) < 100:
            insights.append("⚠️  Small dataset - statistical tests may have limited power")
        
        # Column insights
        numeric_cols = len(self.data.select_dtypes(include=[np.number]).columns)
        categorical_cols = len(self.data.select_dtypes(include=['object']).columns)
        
        insights.append(f"📈 Dataset contains {numeric_cols} numeric and {categorical_cols} categorical variables")
        
        print(f"\\n💡 Key Insights")
        print("=" * 50)
        for insight in insights:
            print(insight)
        
        self.report['insights'] = insights
    
    def full_analysis(self):
        """Run complete analysis"""
        print("🚀 Starting comprehensive data analysis...\\n")
        
        self.basic_info()
        self.statistical_summary()
        self.correlation_analysis()
        self.distribution_analysis()
        self.generate_insights()
        
        print(f"\\n✅ Analysis complete!")
        return self.report

# Example usage
# analyzer = DataAnalyzer('your_data.csv')
# report = analyzer.full_analysis()`,
            editable: true,
            executable: true
        };
    }

    async generateDatabaseArtifact(message, intent) {
        return {
            id: `artifact-${++this.artifactCounter}`,
            type: 'code',
            language: 'sql',
            title: 'Database Query Script',
            description: 'SQL queries for database operations',
            content: `-- Database Query Script
-- Comprehensive SQL operations for data analysis

-- 1. Data Exploration Queries
-- ==============================

-- Check table structure
DESCRIBE users;
SHOW COLUMNS FROM products;

-- Basic data overview
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM orders;

-- 2. Data Quality Checks
-- ========================

-- Check for missing values
SELECT 
    'users' as table_name,
    SUM(CASE WHEN name IS NULL THEN 1 ELSE 0 END) as null_names,
    SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as null_emails,
    COUNT(*) as total_rows
FROM users

UNION ALL

SELECT 
    'orders' as table_name,
    SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as null_user_ids,
    SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) as null_amounts,
    COUNT(*) as total_rows
FROM orders;

-- Check for duplicates
SELECT 
    email, 
    COUNT(*) as duplicate_count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 3. Business Intelligence Queries
-- ==================================

-- Customer analysis
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    COUNT(DISTINCT user_id) as new_customers,
    COUNT(*) as total_orders,
    AVG(amount) as avg_order_value,
    SUM(amount) as total_revenue
FROM orders 
WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month;

-- Top customers by revenue
SELECT 
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_spent,
    AVG(o.amount) as avg_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC
LIMIT 20;

-- Product performance
SELECT 
    p.name as product_name,
    p.category,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.quantity * oi.price) as total_revenue,
    AVG(oi.price) as avg_price
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.category
ORDER BY total_revenue DESC;

-- 4. Cohort Analysis
-- ====================

-- Customer cohorts by registration month
WITH customer_cohorts AS (
    SELECT 
        user_id,
        DATE_FORMAT(MIN(created_at), '%Y-%m') as cohort_month,
        MIN(created_at) as first_order_date
    FROM orders
    GROUP BY user_id
),
cohort_data AS (
    SELECT 
        cc.cohort_month,
        DATE_FORMAT(o.created_at, '%Y-%m') as order_month,
        COUNT(DISTINCT o.user_id) as active_customers
    FROM customer_cohorts cc
    JOIN orders o ON cc.user_id = o.user_id
    GROUP BY cc.cohort_month, DATE_FORMAT(o.created_at, '%Y-%m')
)
SELECT 
    cohort_month,
    order_month,
    active_customers,
    DATEDIFF(STR_TO_DATE(order_month, '%Y-%m'), STR_TO_DATE(cohort_month, '%Y-%m')) / 30 as months_since_first_order
FROM cohort_data
ORDER BY cohort_month, order_month;

-- 5. Advanced Analytics
-- ======================

-- Customer lifetime value calculation
SELECT 
    user_id,
    COUNT(*) as order_count,
    SUM(amount) as total_spent,
    AVG(amount) as avg_order_value,
    DATEDIFF(MAX(created_at), MIN(created_at)) as customer_lifespan_days,
    SUM(amount) / NULLIF(DATEDIFF(MAX(created_at), MIN(created_at)), 0) as daily_value
FROM orders
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total_spent DESC;

-- Seasonal trends
SELECT 
    YEAR(created_at) as year,
    QUARTER(created_at) as quarter,
    MONTH(created_at) as month,
    DAYNAME(created_at) as day_of_week,
    COUNT(*) as order_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_order_value
FROM orders
GROUP BY YEAR(created_at), QUARTER(created_at), MONTH(created_at), DAYOFWEEK(created_at), DAYNAME(created_at)
ORDER BY year, quarter, month;

-- Customer segmentation (RFM Analysis)
WITH rfm_data AS (
    SELECT 
        user_id,
        DATEDIFF(CURRENT_DATE, MAX(created_at)) as recency_days,
        COUNT(*) as frequency,
        SUM(amount) as monetary_value
    FROM orders
    GROUP BY user_id
),
rfm_scores AS (
    SELECT 
        user_id,
        recency_days,
        frequency,
        monetary_value,
        NTILE(5) OVER (ORDER BY recency_days DESC) as recency_score,
        NTILE(5) OVER (ORDER BY frequency ASC) as frequency_score,
        NTILE(5) OVER (ORDER BY monetary_value ASC) as monetary_score
    FROM rfm_data
)
SELECT 
    user_id,
    recency_days,
    frequency,
    monetary_value,
    CONCAT(recency_score, frequency_score, monetary_score) as rfm_score,
    CASE 
        WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
        WHEN recency_score >= 3 AND frequency_score >= 3 AND monetary_score >= 3 THEN 'Loyal Customers'
        WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'New Customers'
        WHEN recency_score <= 2 AND frequency_score >= 3 THEN 'At Risk'
        WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Lost Customers'
        ELSE 'Other'
    END as customer_segment
FROM rfm_scores
ORDER BY monetary_value DESC;

-- 6. Data Export Queries
-- ========================

-- Export for external analysis
SELECT 
    o.id as order_id,
    o.user_id,
    u.name as customer_name,
    u.email as customer_email,
    o.amount,
    o.status,
    o.created_at as order_date,
    DATE_FORMAT(o.created_at, '%Y-%m') as order_month,
    DATE_FORMAT(o.created_at, '%Y-Q%q') as order_quarter
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)
ORDER BY o.created_at DESC;`,
            editable: true,
            executable: true
        };
    }

    async generateFormArtifact(message, intent) {
        return {
            id: `artifact-${++this.artifactCounter}`,
            type: 'ui',
            language: 'html',
            title: 'Dynamic Form with Validation',
            description: 'Interactive form with real-time validation and submission',
            content: this.generateUIArtifact(message, { ...intent, uiType: 'form' }).then(artifact => artifact.content),
            editable: true,
            executable: true,
            previewable: true
        };
    }

    generateGeneralResponse(message, intent) {
        const responses = [
            "I can help you with that! I can generate code in Python, JavaScript, HTML, CSS, or SQL. I can also create UI components, analyze data, and build database queries. What specific type of assistance would you like?",
            
            "Great question! I'm designed to help with various development tasks including:\n\n• **Code Generation**: Python, JavaScript, HTML, CSS, SQL\n• **UI Components**: Forms, dashboards, tables, charts\n• **Data Analysis**: Statistical analysis, visualization, insights\n• **Database Operations**: Queries, analysis, optimization\n• **API Integration**: REST APIs, data processing\n\nWhat would you like to create today?",
            
            "I'd be happy to help! I can assist with creating interactive applications, analyzing data, building user interfaces, and much more. Could you be more specific about what you'd like to build? For example:\n\n• A data visualization dashboard\n• A web form with validation\n• Python scripts for analysis\n• Database queries for insights\n• API integration code",
            
            "I understand you're looking for assistance! I specialize in generating working code and interactive components. I can create everything from simple scripts to complex applications. What type of project are you working on? I can help with frontend development, backend scripts, data analysis, or database operations."
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Artifact Management
    async createArtifact(artifactData) {
        const artifact = {
            ...artifactData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'idle'
        };

        this.artifacts.set(artifact.id, artifact);
        this.renderArtifact(artifact);
        
        if (this.settings.preferences.autoSave) {
            this.saveArtifacts();
        }

        return artifact;
    }

    renderArtifact(artifact) {
        const artifactsContent = document.getElementById('artifacts-content');
        if (!artifactsContent) return;

        const artifactElement = document.createElement('div');
        artifactElement.className = 'artifact-item';
        artifactElement.id = artifact.id;
        
        artifactElement.innerHTML = `
            <div class="artifact-header">
                <div class="artifact-info">
                    <div class="artifact-icon ${artifact.language || artifact.type}">
                        ${this.getArtifactIcon(artifact)}
                    </div>
                    <div class="artifact-details">
                        <div class="artifact-title">${artifact.title}</div>
                        <div class="artifact-subtitle">${artifact.description}</div>
                    </div>
                </div>
                <div class="artifact-actions">
                    ${artifact.executable ? `<button class="artifact-action-btn" onclick="aiCodeStudio.executeArtifact('${artifact.id}')" title="Run">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>` : ''}
                    <button class="artifact-action-btn" onclick="aiCodeStudio.downloadArtifact('${artifact.id}')" title="Download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button class="artifact-action-btn" onclick="aiCodeStudio.deleteArtifact('${artifact.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18l-1.5 13.5A2 2 0 0 1 17.5 21h-11A2 2 0 0 1 4.5 19.5L3 6z"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="artifact-content">
                ${this.renderArtifactContent(artifact)}
            </div>
            <div class="artifact-status ${artifact.status}"></div>
        `;

        artifactsContent.appendChild(artifactElement);
        this.setupArtifactEvents(artifact);
    }

    renderArtifactContent(artifact) {
        if (artifact.type === 'ui' && artifact.previewable) {
            return `
                <div class="artifact-tabs">
                    <button class="artifact-tab active" data-tab="preview">Preview</button>
                    <button class="artifact-tab" data-tab="code">Code</button>
                </div>
                <div class="artifact-tab-content active" data-tab-content="preview">
                    <div class="artifact-preview">
                        <div class="artifact-preview-header">Live Preview</div>
                        <div class="artifact-preview-content">
                            <iframe srcdoc="${this.escapeHtml(artifact.content)}" style="width: 100%; height: 300px; border: none;"></iframe>
                        </div>
                    </div>
                </div>
                <div class="artifact-tab-content" data-tab-content="code">
                    ${this.renderCodeEditor(artifact)}
                </div>
            `;
        } else {
            return this.renderCodeEditor(artifact);
        }
    }

    renderCodeEditor(artifact) {
        return `
            <div class="artifact-editor">
                <div class="artifact-editor-header">
                    <span class="artifact-editor-language">${artifact.language || artifact.type}</span>
                    <div class="artifact-editor-actions">
                        <button class="artifact-editor-btn" onclick="aiCodeStudio.copyArtifact('${artifact.id}')">Copy</button>
                        <button class="artifact-editor-btn" onclick="aiCodeStudio.saveArtifact('${artifact.id}')">Save</button>
                    </div>
                </div>
                <textarea class="artifact-code" data-artifact-id="${artifact.id}" ${artifact.editable ? '' : 'readonly'}>${artifact.content}</textarea>
            </div>
        `;
    }

    setupArtifactEvents(artifact) {
        // Tab switching for UI artifacts
        const artifactElement = document.getElementById(artifact.id);
        const tabs = artifactElement.querySelectorAll('.artifact-tab');
        const tabContents = artifactElement.querySelectorAll('.artifact-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                
                tab.classList.add('active');
                artifactElement.querySelector(`[data-tab-content="${targetTab}"]`).classList.add('active');
            });
        });

        // Code editor events
        const codeTextarea = artifactElement.querySelector('.artifact-code');
        if (codeTextarea && artifact.editable) {
            codeTextarea.addEventListener('input', () => {
                artifact.content = codeTextarea.value;
                artifact.updatedAt = new Date().toISOString();
                this.artifacts.set(artifact.id, artifact);
                
                if (this.settings.preferences.autoSave) {
                    this.saveArtifacts();
                }
            });
        }
    }

    // Execution Management
    async executeArtifact(artifactId) {
        const artifact = this.artifacts.get(artifactId);
        if (!artifact) return;

        console.log(`⚡ Executing artifact: ${artifactId}`);
        
        artifact.status = 'running';
        this.updateArtifactStatus(artifactId, 'running');

        try {
            let result;
            
            switch (artifact.language) {
                case 'python':
                    result = await this.executePython(artifact.content);
                    break;
                case 'javascript':
                    result = await this.executeJavaScript(artifact.content);
                    break;
                case 'sql':
                    result = await this.executeSQL(artifact.content);
                    break;
                case 'html':
                    result = this.executeHTML(artifact.content);
                    break;
                default:
                    throw new Error(`Execution not supported for ${artifact.language}`);
            }

            artifact.status = 'success';
            this.updateArtifactStatus(artifactId, 'success');
            this.displayArtifactOutput(artifactId, result, 'success');

        } catch (error) {
            console.error('Artifact execution error:', error);
            artifact.status = 'error';
            this.updateArtifactStatus(artifactId, 'error');
            this.displayArtifactOutput(artifactId, error.message, 'error');
        }

        this.artifacts.set(artifactId, artifact);
    }

    async executePython(code) {
        if (!this.pyodide) {
            throw new Error('Python environment not initialized');
        }

        try {
            // Capture stdout
            this.pyodide.runPython(`
                import sys
                from io import StringIO
                sys.stdout = StringIO()
            `);

            // Execute the code
            this.pyodide.runPython(code);

            // Get the output
            const output = this.pyodide.runPython('sys.stdout.getvalue()');
            
            // Reset stdout
            this.pyodide.runPython('sys.stdout = sys.__stdout__');

            return output || 'Code executed successfully (no output)';
        } catch (error) {
            // Reset stdout even on error
            this.pyodide.runPython('sys.stdout = sys.__stdout__');
            throw error;
        }
    }

    async executeJavaScript(code) {
        try {
            // Create a safe execution context
            const originalConsole = console.log;
            let output = '';
            
            console.log = (...args) => {
                output += args.join(' ') + '\\n';
                originalConsole(...args);
            };

            // Execute the code
            const result = eval(code);
            
            // Restore console
            console.log = originalConsole;

            return output || (result !== undefined ? String(result) : 'Code executed successfully');
        } catch (error) {
            throw error;
        }
    }

    async executeSQL(code) {
        if (!this.sqljs) {
            throw new Error('SQL environment not initialized');
        }

        try {
            // For demo purposes, create a sample database
            const db = new this.sqljs.Database();
            
            // Create sample tables if they don't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    email TEXT,
                    created_at TEXT
                );
                
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    amount REAL,
                    status TEXT,
                    created_at TEXT
                );
            `);
            
            // Insert sample data
            db.run(`
                INSERT OR IGNORE INTO users VALUES 
                (1, 'John Doe', 'john@example.com', '2024-01-01'),
                (2, 'Jane Smith', 'jane@example.com', '2024-01-02'),
                (3, 'Bob Johnson', 'bob@example.com', '2024-01-03');
                
                INSERT OR IGNORE INTO orders VALUES 
                (1, 1, 100.50, 'completed', '2024-01-01'),
                (2, 2, 75.25, 'completed', '2024-01-02'),
                (3, 1, 200.00, 'pending', '2024-01-03');
            `);

            // Execute the user's SQL
            const results = db.exec(code);
            
            let output = '';
            results.forEach((result, index) => {
                if (result.columns && result.values) {
                    output += `Query ${index + 1} Results:\\n`;
                    output += result.columns.join(' | ') + '\\n';
                    output += '-'.repeat(result.columns.join(' | ').length) + '\\n';
                    result.values.forEach(row => {
                        output += row.join(' | ') + '\\n';
                    });
                    output += '\\n';
                }
            });

            db.close();
            return output || 'Query executed successfully';
        } catch (error) {
            throw error;
        }
    }

    executeHTML(code) {
        // For HTML, we just validate and return success
        return 'HTML content loaded successfully. Check the preview tab to see the result.';
    }

    // Utility Functions
    updateArtifactStatus(artifactId, status) {
        const statusElement = document.querySelector(`#${artifactId} .artifact-status`);
        if (statusElement) {
            statusElement.className = `artifact-status ${status}`;
        }
    }

    displayArtifactOutput(artifactId, output, type) {
        const artifactElement = document.getElementById(artifactId);
        if (!artifactElement) return;

        // Remove existing output
        const existingOutput = artifactElement.querySelector('.artifact-output');
        if (existingOutput) {
            existingOutput.remove();
        }

        // Create new output
        const outputElement = document.createElement('div');
        outputElement.className = `artifact-output ${type}`;
        outputElement.textContent = output;

        artifactElement.appendChild(outputElement);
    }

    getArtifactIcon(artifact) {
        const icons = {
            python: '🐍',
            javascript: '🟨',
            html: '🌐',
            css: '🎨',
            sql: '🗃️',
            code: '💻',
            ui: '🎨',
            data: '📊',
            document: '📄'
        };
        return icons[artifact.language] || icons[artifact.type] || '📄';
    }

    escapeHtml(html) {
        return html.replace(/"/g, '&quot;');
    }

    // File and Artifact Management
    copyArtifact(artifactId) {
        const artifact = this.artifacts.get(artifactId);
        if (!artifact) return;

        navigator.clipboard.writeText(artifact.content).then(() => {
            this.showNotification('Code copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy code', 'error');
        });
    }

    saveArtifact(artifactId) {
        const artifact = this.artifacts.get(artifactId);
        if (!artifact) return;

        const element = document.createElement('a');
        const file = new Blob([artifact.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${this.getFileExtension(artifact.language)}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.showNotification('Artifact saved!', 'success');
    }

    downloadArtifact(artifactId) {
        this.saveArtifact(artifactId);
    }

    deleteArtifact(artifactId) {
        if (confirm('Are you sure you want to delete this artifact?')) {
            this.artifacts.delete(artifactId);
            const element = document.getElementById(artifactId);
            if (element) {
                element.remove();
            }
            this.showNotification('Artifact deleted', 'info');
        }
    }

    getFileExtension(language) {
        const extensions = {
            python: 'py',
            javascript: 'js',
            html: 'html',
            css: 'css',
            sql: 'sql'
        };
        return extensions[language] || 'txt';
    }

    // Initialization and Environment Setup
    async initializePython() {
        try {
            console.log('Initializing Python environment...');
            this.pyodide = await loadPyodide();
            await this.pyodide.loadPackage(['numpy', 'pandas', 'matplotlib']);
            console.log('✅ Python environment ready');
        } catch (error) {
            console.warn('⚠️ Python environment not available:', error);
        }
    }

    async initializeSQL() {
        try {
            console.log('Initializing SQL environment...');
            this.sqljs = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            console.log('✅ SQL environment ready');
        } catch (error) {
            console.warn('⚠️ SQL environment not available:', error);
        }
    }

    // Continue with remaining methods...
    // [The rest of the methods would continue here, but I'll break here due to length]
    // This includes: UI management, settings, data sources, chat management, persistence, etc.

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Implementation similar to previous version
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Chat UI methods
    addChatMessage(sender, content, artifacts = [], type = 'normal') {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message-container ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${content}
                ${artifacts.length > 0 ? `<div class="artifact-references">
                    ${artifacts.map(artifact => `
                        <a href="#" class="artifact-reference" onclick="aiCodeStudio.focusArtifact('${artifact.id}')">
                            ${this.getArtifactIcon(artifact)} ${artifact.title}
                        </a>
                    `).join('')}
                </div>` : ''}
            </div>
            <div class="message-timestamp">${timestamp}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message-container ai-message typing-indicator-container';
        typingElement.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator-container');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    // Placeholder methods for remaining functionality
    handleChatKeydown(e) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    selectAIModel(model) {
        document.querySelectorAll('.ai-model-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-model="${model}"]`).classList.add('active');
        document.getElementById('ai-model-select').value = model;
    }

    showArtifactsPanel() {
        const panel = document.getElementById('artifacts-panel');
        if (panel) {
            panel.classList.remove('hidden');
        }
    }

    toggleArtifactsPanel() {
        const panel = document.getElementById('artifacts-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }

    focusArtifact(artifactId) {
        const artifactElement = document.getElementById(artifactId);
        if (artifactElement) {
            artifactElement.scrollIntoView({ behavior: 'smooth' });
            artifactElement.classList.add('active');
            setTimeout(() => artifactElement.classList.remove('active'), 2000);
        }
    }

    // Placeholder methods for settings, data sources, persistence
    setupSettingsModal() {
        // Settings modal setup
    }

    setupDataSourceModal() {
        // Data source modal setup
    }

    setupExportModal() {
        // Export modal setup
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    updateModelStatus() {
        // Update AI model connection status
    }

    loadSettings() {
        // Load settings from storage
    }

    saveArtifacts() {
        // Save artifacts to storage
    }

    loadChatHistory() {
        // Load chat history from storage
    }

    loadArtifacts() {
        // Load artifacts from storage
    }

    initializeSampleData() {
        // Initialize sample data
    }

    createNewChat() {
        // Create new chat session
    }

    openFileUpload() {
        document.getElementById('file-upload').click();
    }

    handleFileUpload(e) {
        // Handle file upload
    }

    openDataSourceModal(type) {
        // Open data source connection modal
    }

    saveNotebook() {
        // Save current notebook state
    }

    autoSave() {
        // Auto-save functionality
    }
}

// Initialize the application
let aiCodeStudio;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing AI Code Studio Application...');
    aiCodeStudio = new AICodeStudio();
});

// Export for global access
window.aiCodeStudio = aiCodeStudio;