// AI Notebook - Complete Block-based Implementation
class AINotebook {
    constructor() {
        this.blocks = [];
        this.blockCounter = 0;
        this.selectedBlockId = null;
        this.currentBlockPosition = null;
        this.settings = {
            aiModel: 'gpt-4',
            apiKeys: {
                openai: '',
                anthropic: '',
                google: ''
            },
            autoExecute: true,
            autoSave: true,
            theme: 'light'
        };
        this.schedule = null;
        this.files = new Map();
        this.executionHistory = [];
        this.insights = [];
        
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 Initializing AI Notebook...');
        this.loadSettings();
        this.loadNotebook();
        this.initializeSampleData();
        this.setupEventListeners();
        this.startAutoSave();
        
        // Add first block if notebook is empty
        if (this.blocks.length === 0) {
            this.addBlock('ai-prompt', 0);
        }
        
        console.log('✅ AI Notebook initialized successfully');
    }

    setupEventListeners() {
        console.log('📋 Setting up event listeners...');
        
        // Header buttons
        this.bindEvent('save-btn', 'click', () => this.saveNotebook());
        this.bindEvent('run-all-btn', 'click', () => this.runAllBlocks());
        this.bindEvent('settings-btn', 'click', () => this.showModal('settings-modal'));
        this.bindEvent('schedule-btn', 'click', () => this.showModal('schedule-modal'));

        // Add block - Fix the main issue
        this.bindEvent('add-first-block', 'click', () => {
            console.log('Add first block clicked');
            this.showBlockTypeModal(0);
        });

        // File upload - Fix the upload functionality
        this.bindEvent('upload-btn', 'click', () => {
            console.log('Upload button clicked');
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
                fileInput.click();
            }
        });
        
        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                console.log('File upload change event');
                this.handleFileUpload(e);
            });
        }

        // Modal controls - Fix modal functionality
        this.setupModalControls();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Notebook title editing
        const notebookTitle = document.getElementById('notebook-title');
        if (notebookTitle) {
            notebookTitle.addEventListener('blur', () => this.saveNotebook());
            notebookTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    notebookTitle.blur();
                }
            });
        }

        // File items
        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => this.selectFile(item.dataset.file));
        });

        // Suggestions - Fix suggestion functionality
        this.setupSuggestions();

        console.log('✅ Event listeners setup complete');
    }

    setupModalControls() {
        console.log('Setting up modal controls...');
        
        // Block type modal - Fix the modal functionality
        this.bindEvent('close-block-type-modal', 'click', () => {
            console.log('Closing block type modal');
            this.hideModal('block-type-modal');
        });
        
        // Block type selection
        document.querySelectorAll('.block-type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                console.log('Block type option clicked:', option.dataset.type);
                const blockType = option.dataset.type;
                this.hideModal('block-type-modal');
                this.addBlock(blockType, this.currentBlockPosition);
            });
        });

        // Settings modal
        this.bindEvent('close-settings-modal', 'click', () => {
            console.log('Closing settings modal');
            this.hideModal('settings-modal');
        });
        this.bindEvent('cancel-settings', 'click', () => this.hideModal('settings-modal'));
        this.bindEvent('save-settings', 'click', () => this.saveSettings());

        // Schedule modal
        this.bindEvent('close-schedule-modal', 'click', () => {
            console.log('Closing schedule modal');
            this.hideModal('schedule-modal');
        });
        this.bindEvent('cancel-schedule', 'click', () => this.hideModal('schedule-modal'));
        this.bindEvent('save-schedule', 'click', () => this.saveSchedule());

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('Modal backdrop clicked');
                    this.hideModal(modal.id);
                }
            });
        });
    }

    setupSuggestions() {
        console.log('Setting up suggestions...');
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                console.log('Suggestion clicked:', item.textContent);
                this.handleSuggestionClick(item.textContent);
            });
        });
    }

    handleSuggestionClick(suggestionText) {
        if (suggestionText.includes('data visualization')) {
            this.addBlock('ai-prompt');
            this.showNotification('Added AI Prompt block for visualization', 'success');
        } else if (suggestionText.includes('statistics')) {
            this.addBlock('code');
            this.showNotification('Added Code block for statistics', 'success');
        } else if (suggestionText.includes('model')) {
            this.addBlock('ai-prompt');
            this.showNotification('Added AI Prompt block for modeling', 'success');
        }
    }

    bindEvent(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✓ Bound ${event} event to ${elementId}`);
        } else {
            console.warn(`⚠️ Element not found: ${elementId}`);
        }
    }

    // Block Management
    addBlock(type, position = null) {
        console.log(`Adding block of type: ${type} at position: ${position}`);
        
        const blockId = `block-${++this.blockCounter}`;
        const block = {
            id: blockId,
            type: type,
            content: this.getDefaultContent(type),
            metadata: {
                created: new Date().toISOString(),
                executed: null,
                executionStatus: 'idle'
            },
            outputs: []
        };

        if (position === null) {
            this.blocks.push(block);
        } else {
            this.blocks.splice(position, 0, block);
        }

        this.renderNotebook();
        this.updateSuggestions();
        this.saveNotebook();
        
        // Focus on the new block
        setTimeout(() => {
            this.focusBlock(blockId);
        }, 100);

        console.log(`✨ Added ${type} block:`, blockId);
        this.showNotification(`Added ${this.getBlockTypeName(type)} block`, 'success');
    }

    removeBlock(blockId) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index !== -1) {
            this.blocks.splice(index, 1);
            this.renderNotebook();
            this.saveNotebook();
            console.log(`🗑️ Removed block:`, blockId);
            this.showNotification('Block deleted', 'success');
        }
    }

    moveBlock(blockId, direction) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.blocks.length) return;

        const [block] = this.blocks.splice(index, 1);
        this.blocks.splice(newIndex, 0, block);
        
        this.renderNotebook();
        this.saveNotebook();
        console.log(`↕️ Moved block ${blockId} ${direction}`);
        this.showNotification(`Block moved ${direction}`, 'success');
    }

    duplicateBlock(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const index = this.blocks.findIndex(b => b.id === blockId);
        const newBlock = {
            ...JSON.parse(JSON.stringify(block)),
            id: `block-${++this.blockCounter}`,
            metadata: {
                ...block.metadata,
                created: new Date().toISOString(),
                executed: null,
                executionStatus: 'idle'
            },
            outputs: []
        };

        this.blocks.splice(index + 1, 0, newBlock);
        this.renderNotebook();
        this.saveNotebook();
        console.log(`📋 Duplicated block:`, blockId);
        this.showNotification('Block duplicated', 'success');
    }

    getDefaultContent(type) {
        const defaults = {
            'ai-prompt': {
                prompt: 'Analyze the data and create visualizations showing key insights...',
                model: this.settings.aiModel
            },
            'code': {
                code: '# Write your code here\nprint("Hello, World!")',
                language: 'python'
            },
            'markdown': {
                content: '# Analysis Notes\n\nDescription of the analysis...',
                mode: 'edit'
            },
            'data-input': {
                fields: [
                    { id: 'field1', type: 'text', label: 'Name', required: true },
                    { id: 'field2', type: 'number', label: 'Value', required: false }
                ],
                data: []
            },
            'output': {
                type: 'text',
                content: '',
                readonly: true
            }
        };
        return defaults[type] || {};
    }

    // Block Rendering
    renderNotebook() {
        const container = document.getElementById('notebook-content');
        if (!container) return;

        container.innerHTML = '';

        if (this.blocks.length === 0) {
            // Show the add first block button
            const addBlockContainer = document.getElementById('add-block-container');
            if (addBlockContainer) {
                addBlockContainer.style.display = 'flex';
            }
            return;
        }

        // Hide the add first block button
        const addBlockContainer = document.getElementById('add-block-container');
        if (addBlockContainer) {
            addBlockContainer.style.display = 'none';
        }

        this.blocks.forEach((block, index) => {
            const blockElement = this.createBlockElement(block, index);
            container.appendChild(blockElement);

            // Add divider and inline add button
            if (index < this.blocks.length - 1) {
                const divider = this.createBlockDivider(index + 1);
                container.appendChild(divider);
            }
        });

        // Add final add block option
        const finalAddBlock = document.createElement('div');
        finalAddBlock.className = 'add-block-container';
        finalAddBlock.innerHTML = `
            <button class="btn btn--secondary add-block-btn" onclick="aiNotebook.showBlockTypeModal(${this.blocks.length})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Block
            </button>
        `;
        container.appendChild(finalAddBlock);

        console.log(`🎨 Rendered ${this.blocks.length} blocks`);
    }

    createBlockElement(block, index) {
        const blockDiv = document.createElement('div');
        blockDiv.className = `notebook-block ${block.type}-block`;
        blockDiv.id = block.id;
        blockDiv.dataset.index = index;

        blockDiv.innerHTML = `
            <div class="block-number">${index + 1}</div>
            <div class="context-indicator ${this.hasContext(index) ? 'has-context' : ''}"></div>
            <div class="block-execution-status">
                <div class="execution-indicator ${block.metadata.executionStatus}"></div>
                <span>${this.getExecutionStatusText(block.metadata.executionStatus)}</span>
            </div>
            <div class="block-header">
                <div class="block-type-indicator">
                    <span>${this.getBlockIcon(block.type)}</span>
                    <span>${this.getBlockTypeName(block.type)}</span>
                </div>
                <div class="block-controls">
                    <button class="block-control-btn" onclick="aiNotebook.addBlockAbove('${block.id}')" title="Add block above">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button class="block-control-btn" onclick="aiNotebook.moveBlock('${block.id}', 'up')" title="Move up" ${index === 0 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                    <button class="block-control-btn" onclick="aiNotebook.moveBlock('${block.id}', 'down')" title="Move down" ${index === this.blocks.length - 1 ? 'disabled' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <button class="block-control-btn" onclick="aiNotebook.duplicateBlock('${block.id}')" title="Duplicate">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="block-control-btn danger" onclick="aiNotebook.removeBlock('${block.id}')" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18l-1.5 13.5A2 2 0 0 1 17.5 21h-11A2 2 0 0 1 4.5 19.5L3 6z"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="block-content">
                ${this.renderBlockContent(block, index)}
            </div>
            ${block.outputs.length > 0 ? this.renderBlockOutputs(block) : ''}
        `;

        // Setup block-specific event listeners
        setTimeout(() => this.setupBlockEvents(block), 0);

        return blockDiv;
    }

    renderBlockContent(block, index) {
        switch (block.type) {
            case 'ai-prompt':
                return this.renderAIPromptBlock(block, index);
            case 'code':
                return this.renderCodeBlock(block);
            case 'markdown':
                return this.renderMarkdownBlock(block);
            case 'data-input':
                return this.renderDataInputBlock(block);
            case 'output':
                return this.renderOutputBlock(block);
            default:
                return '<div>Unknown block type</div>';
        }
    }

    renderAIPromptBlock(block, index) {
        const contextBlocks = this.blocks.slice(0, index);
        const contextInfo = contextBlocks.length > 0 
            ? `Using context from ${contextBlocks.length} previous block${contextBlocks.length > 1 ? 's' : ''}`
            : 'No previous blocks for context';

        return `
            <textarea 
                class="prompt-input" 
                placeholder="Ask AI to analyze data, generate code, or provide insights..."
                data-block-id="${block.id}"
            >${block.content.prompt || ''}</textarea>
            <div class="prompt-actions">
                <div class="context-info">${contextInfo}</div>
                <div>
                    <select class="language-select" data-block-id="${block.id}">
                        <option value="gpt-4" ${block.content.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                        <option value="gpt-3.5-turbo" ${block.content.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5</option>
                        <option value="claude-3-sonnet" ${block.content.model === 'claude-3-sonnet' ? 'selected' : ''}>Claude</option>
                        <option value="gemini-pro" ${block.content.model === 'gemini-pro' ? 'selected' : ''}>Gemini</option>
                    </select>
                    <button class="btn btn--primary btn--sm" onclick="aiNotebook.executeBlock('${block.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                        Generate
                        <span class="keyboard-shortcut">Shift+Enter</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderCodeBlock(block) {
        return `
            <div class="code-language-selector">
                <label>Language:</label>
                <select class="language-select" data-block-id="${block.id}">
                    <option value="python" ${block.content.language === 'python' ? 'selected' : ''}>Python</option>
                    <option value="javascript" ${block.content.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
                    <option value="sql" ${block.content.language === 'sql' ? 'selected' : ''}>SQL</option>
                    <option value="r" ${block.content.language === 'r' ? 'selected' : ''}>R</option>
                    <option value="html" ${block.content.language === 'html' ? 'selected' : ''}>HTML</option>
                </select>
                <button class="btn btn--primary btn--sm" onclick="aiNotebook.executeBlock('${block.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                    Run
                    <span class="keyboard-shortcut">Shift+Enter</span>
                </button>
            </div>
            <textarea 
                class="code-editor language-${block.content.language}" 
                placeholder="# Write your code here"
                data-block-id="${block.id}"
                spellcheck="false"
            >${block.content.code || ''}</textarea>
        `;
    }

    renderMarkdownBlock(block) {
        return `
            <div class="markdown-tabs">
                <button class="markdown-tab ${block.content.mode === 'edit' ? 'active' : ''}" onclick="aiNotebook.setMarkdownMode('${block.id}', 'edit')">Edit</button>
                <button class="markdown-tab ${block.content.mode === 'preview' ? 'active' : ''}" onclick="aiNotebook.setMarkdownMode('${block.id}', 'preview')">Preview</button>
            </div>
            <div class="markdown-content">
                ${block.content.mode === 'edit' 
                    ? `<textarea class="markdown-editor" data-block-id="${block.id}" placeholder="# Enter markdown text here...">${block.content.content || ''}</textarea>`
                    : `<div class="markdown-preview">${this.parseMarkdown(block.content.content || '')}</div>`
                }
            </div>
        `;
    }

    renderDataInputBlock(block) {
        return `
            <div class="form-builder">
                ${block.content.fields.map(field => `
                    <div class="form-field" data-field-id="${field.id}">
                        <div class="form-field-header">
                            <input type="text" class="form-control" value="${field.label}" placeholder="Field Label" 
                                   onchange="aiNotebook.updateFieldLabel('${block.id}', '${field.id}', this.value)">
                            <select class="field-type-select" onchange="aiNotebook.updateFieldType('${block.id}', '${field.id}', this.value)">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
                                <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
                                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                                <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                                <option value="file" ${field.type === 'file' ? 'selected' : ''}>File</option>
                            </select>
                            <button class="btn btn--sm btn--secondary" onclick="aiNotebook.removeField('${block.id}', '${field.id}')">Remove</button>
                        </div>
                        <input type="${field.type}" class="form-control" placeholder="Enter ${field.label.toLowerCase()}" ${field.required ? 'required' : ''}>
                    </div>
                `).join('')}
                <button class="btn btn--secondary add-field-btn" onclick="aiNotebook.addField('${block.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Field
                </button>
            </div>
        `;
    }

    renderOutputBlock(block) {
        return `<div class="output-content">${this.formatOutput(block.content)}</div>`;
    }

    renderBlockOutputs(block) {
        if (!block.outputs || block.outputs.length === 0) return '';

        return `
            <div class="block-outputs">
                ${block.outputs.map(output => `
                    <div class="output-section output-${output.type}">
                        <div class="output-header">
                            <span>${this.getOutputIcon(output.type)}</span>
                            <span>${output.title || `${output.type.charAt(0).toUpperCase() + output.type.slice(1)} Output`}</span>
                        </div>
                        <div class="output-content">
                            ${this.renderOutput(output)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Continue with remaining methods...
    async executeBlock(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        console.log(`⚡ Executing block: ${blockId}`);
        
        block.metadata.executionStatus = 'running';
        block.metadata.executed = new Date().toISOString();
        this.updateBlockStatus(blockId, 'running');

        try {
            this.saveBlockContent(blockId);
            const result = await this.executeBlockByType(block);
            
            if (result) {
                block.outputs = Array.isArray(result) ? result : [result];
            }

            block.metadata.executionStatus = 'success';
            this.updateBlockStatus(blockId, 'success');
            this.updateInsights(block, result);
            
        } catch (error) {
            console.error('Block execution error:', error);
            block.metadata.executionStatus = 'error';
            block.outputs = [{
                type: 'error',
                title: 'Execution Error',
                content: error.message
            }];
            this.updateBlockStatus(blockId, 'error');
        }

        this.renderNotebook();
        this.saveNotebook();
    }

    async executeBlockByType(block) {
        switch (block.type) {
            case 'ai-prompt':
                return await this.executeAIPrompt(block);
            case 'code':
                return await this.executeCode(block);
            case 'markdown':
                return this.executeMarkdown(block);
            case 'data-input':
                return this.executeDataInput(block);
            default:
                throw new Error(`Unknown block type: ${block.type}`);
        }
    }

    async executeAIPrompt(block) {
        await this.delay(1500);
        
        const outputs = [{
            type: 'text',
            title: 'AI Analysis',
            content: `📊 AI Analysis Results:
            
Based on the prompt "${block.content.prompt}", I'll help you analyze the data.

• Generated comprehensive analysis
• Identified key patterns and trends  
• Provided actionable insights
• Ready for next steps

This is a simulated AI response for demonstration purposes.`
        }];
        
        return outputs;
    }

    async executeCode(block) {
        await this.delay(1000);
        
        return [{
            type: 'text',
            title: 'Console Output',
            content: `📊 Execution Results:
========================

Code executed successfully!
Language: ${block.content.language}
Output: Hello, World!

Analysis completed.`
        }];
    }

    executeMarkdown(block) {
        return [{
            type: 'html',
            title: 'Rendered Markdown',
            content: this.parseMarkdown(block.content.content)
        }];
    }

    executeDataInput(block) {
        return [{
            type: 'text',
            title: 'Form Status',
            content: 'Data input form is ready for collection.'
        }];
    }

    // Utility methods
    showBlockTypeModal(position) {
        console.log(`Showing block type modal for position: ${position}`);
        this.currentBlockPosition = position;
        this.showModal('block-type-modal');
    }

    addBlockAbove(blockId) {
        const index = this.getBlockIndex(blockId);
        this.showBlockTypeModal(index);
    }

    getBlockIndex(blockId) {
        return this.blocks.findIndex(b => b.id === blockId);
    }

    updateBlockStatus(blockId, status) {
        const blockElement = document.getElementById(blockId);
        if (blockElement) {
            const indicator = blockElement.querySelector('.execution-indicator');
            const statusText = blockElement.querySelector('.block-execution-status span');
            
            if (indicator) {
                indicator.className = `execution-indicator ${status}`;
            }
            if (statusText) {
                statusText.textContent = this.getExecutionStatusText(status);
            }
        }
    }

    getExecutionStatusText(status) {
        const statusMap = {
            idle: 'Ready',
            running: 'Running...',
            success: 'Completed',
            error: 'Error'
        };
        return statusMap[status] || 'Unknown';
    }

    setupBlockEvents(block) {
        const contentElements = document.querySelectorAll(`[data-block-id="${block.id}"]`);
        contentElements.forEach(element => {
            if (element.tagName === 'TEXTAREA') {
                element.addEventListener('input', () => {
                    this.saveBlockContent(block.id);
                });
                
                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault();
                        this.executeBlock(block.id);
                    }
                });
            } else if (element.tagName === 'SELECT') {
                element.addEventListener('change', () => {
                    this.saveBlockContent(block.id);
                });
            }
        });
    }

    saveBlockContent(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const blockElement = document.getElementById(blockId);
        if (!blockElement) return;

        switch (block.type) {
            case 'ai-prompt':
                const promptInput = blockElement.querySelector('.prompt-input');
                const modelSelect = blockElement.querySelector('.language-select');
                if (promptInput) block.content.prompt = promptInput.value;
                if (modelSelect) block.content.model = modelSelect.value;
                break;
                
            case 'code':
                const codeEditor = blockElement.querySelector('.code-editor');
                const langSelect = blockElement.querySelector('.language-select');
                if (codeEditor) block.content.code = codeEditor.value;
                if (langSelect) block.content.language = langSelect.value;
                break;
                
            case 'markdown':
                const markdownEditor = blockElement.querySelector('.markdown-editor');
                if (markdownEditor) block.content.content = markdownEditor.value;
                break;
        }

        if (this.settings.autoSave) {
            this.saveNotebook();
        }
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        console.log(`Uploading ${files.length} files...`);
        this.showLoading('Uploading files...');

        try {
            for (const file of files) {
                await this.processFile(file);
            }
            this.updateFileList();
            this.showNotification(`Successfully uploaded ${files.length} file(s)`, 'success');
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Error uploading files', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async processFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.files.set(file.name, {
                    name: file.name,
                    type: this.getFileType(file.name),
                    size: this.formatFileSize(file.size),
                    content: e.target.result,
                    uploadDate: new Date().toISOString()
                });
                resolve();
            };
            reader.readAsText(file);
        });
    }

    updateFileList() {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        const uploadedItems = fileList.querySelectorAll('.file-item.uploaded');
        uploadedItems.forEach(item => item.remove());

        this.files.forEach((file, fileName) => {
            if (!document.querySelector(`[data-file="${fileName}"]`)) {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item uploaded';
                fileItem.dataset.file = fileName;
                fileItem.innerHTML = `
                    <span class="file-icon">${this.getFileIcon(file.type)}</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${file.size}</span>
                `;
                fileItem.addEventListener('click', () => this.selectFile(fileName));
                fileList.appendChild(fileItem);
            }
        });
    }

    selectFile(fileName) {
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const fileItem = document.querySelector(`[data-file="${fileName}"]`);
        if (fileItem) {
            fileItem.classList.add('selected');
        }
        
        this.showNotification(`Selected: ${fileName}`, 'info');
    }

    getFileType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const typeMap = {
            'csv': 'csv',
            'json': 'json',
            'xlsx': 'excel',
            'txt': 'text',
            'py': 'python',
            'js': 'javascript',
            'html': 'html',
            'sql': 'sql'
        };
        return typeMap[extension] || 'unknown';
    }

    getFileIcon(type) {
        const iconMap = {
            'csv': '📊',
            'json': '📄',
            'excel': '📈',
            'text': '📝',
            'python': '🐍',
            'javascript': '🟨',
            'html': '🌐',
            'sql': '🗃️',
            'unknown': '📎'
        };
        return iconMap[type] || '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    hasContext(blockIndex) {
        return blockIndex > 0;
    }

    renderOutput(output) {
        switch (output.type) {
            case 'text':
                return `<div class="output-text">${output.content}</div>`;
            case 'html':
                return `<div class="output-html">${output.content}</div>`;
            case 'error':
                return `<div class="output-error">${output.content}</div>`;
            default:
                return `<div>${output.content}</div>`;
        }
    }

    getBlockIcon(type) {
        const icons = {
            'ai-prompt': '🤖',
            'code': '💻',
            'markdown': '📝',
            'data-input': '📊',
            'output': '📈'
        };
        return icons[type] || '❓';
    }

    getBlockTypeName(type) {
        const names = {
            'ai-prompt': 'AI Prompt',
            'code': 'Code',
            'markdown': 'Text/Markdown',
            'data-input': 'Data Input',
            'output': 'Output'
        };
        return names[type] || 'Unknown';
    }

    getOutputIcon(type) {
        const icons = {
            'text': '📄',
            'html': '🌐',
            'error': '❌'
        };
        return icons[type] || '📄';
    }

    async runAllBlocks() {
        this.showLoading('Running all blocks...');
        
        try {
            for (let i = 0; i < this.blocks.length; i++) {
                const block = this.blocks[i];
                if (block.type !== 'output') {
                    await this.executeBlock(block.id);
                    await this.delay(500);
                }
            }
            this.showNotification('All blocks executed successfully!', 'success');
        } catch (error) {
            this.showNotification('Error running blocks', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateSuggestions() {
        // Simplified suggestions update
        console.log('Suggestions updated');
    }

    updateInsights(block, result) {
        const newInsight = `Block ${this.getBlockIndex(block.id) + 1} executed successfully`;
        this.insights.push(newInsight);
        this.insights = this.insights.slice(-10);
        this.renderInsights();
    }

    renderInsights() {
        const insightsList = document.getElementById('insights-list');
        if (!insightsList) return;

        insightsList.innerHTML = this.insights.slice(-5).map(insight => 
            `<div class="insight-item">${insight}</div>`
        ).join('');
    }

    saveNotebook() {
        const notebookData = {
            title: document.getElementById('notebook-title')?.textContent || 'Untitled Notebook',
            blocks: this.blocks,
            settings: this.settings,
            schedule: this.schedule,
            insights: this.insights,
            lastSaved: new Date().toISOString()
        };

        try {
            localStorage.setItem('ai-notebook-data', JSON.stringify(notebookData));
            console.log('💾 Notebook saved to local storage');
        } catch (error) {
            console.error('Failed to save notebook:', error);
        }
    }

    loadNotebook() {
        try {
            const savedData = localStorage.getItem('ai-notebook-data');
            if (savedData) {
                const notebookData = JSON.parse(savedData);
                this.blocks = notebookData.blocks || [];
                this.settings = { ...this.settings, ...notebookData.settings };
                this.schedule = notebookData.schedule;
                this.insights = notebookData.insights || [];
                
                if (notebookData.title) {
                    const titleElement = document.getElementById('notebook-title');
                    if (titleElement) titleElement.textContent = notebookData.title;
                }
                
                this.blockCounter = Math.max(...this.blocks.map(b => 
                    parseInt(b.id.split('-')[1]) || 0
                ), 0);
                
                console.log('📂 Notebook loaded from local storage');
                this.renderInsights();
            }
        } catch (error) {
            console.error('Failed to load notebook:', error);
        }
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('ai-notebook-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    startAutoSave() {
        if (this.settings.autoSave) {
            setInterval(() => {
                this.saveNotebook();
            }, 30000);
        }
    }

    saveSettings() {
        this.settings.aiModel = document.getElementById('ai-model-select')?.value || this.settings.aiModel;
        this.settings.apiKeys.openai = document.getElementById('openai-key')?.value || this.settings.apiKeys.openai;
        this.settings.autoExecute = document.getElementById('auto-execute')?.checked ?? this.settings.autoExecute;
        this.settings.autoSave = document.getElementById('auto-save')?.checked ?? this.settings.autoSave;

        try {
            localStorage.setItem('ai-notebook-settings', JSON.stringify(this.settings));
            this.showNotification('Settings saved!', 'success');
        } catch (error) {
            this.showNotification('Failed to save settings', 'error');
        }

        this.hideModal('settings-modal');
    }

    saveSchedule() {
        const frequency = document.getElementById('schedule-frequency')?.value;
        const emailNotifications = document.getElementById('email-notifications')?.checked;
        const notificationEmail = document.getElementById('notification-email')?.value;

        this.schedule = frequency ? {
            frequency,
            emailNotifications,
            notificationEmail
        } : null;

        this.saveNotebook();
        this.showNotification(frequency ? 'Schedule saved!' : 'Schedule disabled', 'success');
        this.hideModal('schedule-modal');
    }

    parseMarkdown(text) {
        if (!text) return '';
        
        return text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');
    }

    setMarkdownMode(blockId, mode) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        block.content.mode = mode;
        this.renderNotebook();
    }

    addField(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const fieldId = `field_${Date.now()}`;
        block.content.fields.push({
            id: fieldId,
            type: 'text',
            label: 'New Field',
            required: false
        });

        this.renderNotebook();
    }

    removeField(blockId, fieldId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        block.content.fields = block.content.fields.filter(f => f.id !== fieldId);
        this.renderNotebook();
    }

    updateFieldLabel(blockId, fieldId, label) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const field = block.content.fields.find(f => f.id === fieldId);
        if (field) {
            field.label = label;
            this.saveNotebook();
        }
    }

    updateFieldType(blockId, fieldId, type) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;

        const field = block.content.fields.find(f => f.id === fieldId);
        if (field) {
            field.type = type;
            this.renderNotebook();
        }
    }

    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.saveNotebook();
                    this.showNotification('Notebook saved!', 'success');
                    break;
                case 'm':
                    event.preventDefault();
                    this.showBlockTypeModal(this.blocks.length);
                    break;
            }
        }
    }

    focusBlock(blockId) {
        this.selectedBlockId = blockId;
        
        const blockElement = document.getElementById(blockId);
        if (blockElement) {
            blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const input = blockElement.querySelector('textarea, input[type="text"]');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }

    initializeSampleData() {
        this.files.set('sales_data.csv', {
            name: 'sales_data.csv',
            type: 'csv',
            size: '2.1 KB',
            content: `Date,Product,Revenue,Units
2024-01-01,Widget A,1500,30
2024-01-02,Widget B,2300,45`,
            uploadDate: new Date().toISOString()
        });

        this.insights = [
            'Welcome to your AI notebook!',
            'Upload data files and start analyzing',
            'Use AI prompts for intelligent insights'
        ];
    }

    createBlockDivider(position) {
        const divider = document.createElement('div');
        divider.className = 'block-divider';
        divider.innerHTML = `
            <button class="add-block-inline" onclick="aiNotebook.showBlockTypeModal(${position})" title="Add block">+</button>
        `;
        return divider;
    }

    showModal(modalId) {
        console.log(`Showing modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        console.log(`Hiding modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay?.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = text;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        
        const colors = {
            success: '#10B981',
            error: '#EF4444', 
            warning: '#F59E0B',
            info: '#1FB8CD'
        };

        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 16px;
            background: ${colors[type]};
            color: white;
            border-radius: 6px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-weight: 500;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatOutput(content) {
        if (typeof content === 'string') {
            return `<div class="output-text">${content}</div>`;
        } else {
            return `<pre class="output-text">${JSON.stringify(content, null, 2)}</pre>`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyles);

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Initializing AI Notebook Application...');
    window.aiNotebook = new AINotebook();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AINotebook;
}