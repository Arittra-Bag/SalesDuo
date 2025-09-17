// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const elements = {
    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Text Input
    meetingText: document.getElementById('meeting-text'),
    charCount: document.getElementById('char-count'),
    
    // File Upload
    fileUpload: document.getElementById('file-upload'),
    fileInput: document.getElementById('file-input'),
    fileInfo: document.getElementById('file-info'),
    fileName: document.getElementById('file-name'),
    removeFile: document.getElementById('remove-file'),
    
    // Buttons
    processBtn: document.getElementById('process-btn'),
    clearBtn: document.getElementById('clear-btn'),
    copyJsonBtn: document.getElementById('copy-json'),
    downloadJsonBtn: document.getElementById('download-json'),
    retryBtn: document.getElementById('retry-btn'),
    
    // Results
    resultsSection: document.getElementById('results-section'),
    summaryContent: document.getElementById('summary-content'),
    decisionsList: document.getElementById('decisions-list'),
    actionItems: document.getElementById('action-items'),
    
    // States
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text')
};

// Global State
let currentFile = null;
let lastResults = null;
let activeTab = 'text';
let processingInterval = null;
let processingStep = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharCount();
});

// Event Listeners
function initializeEventListeners() {
    // Tab switching
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Text input
    elements.meetingText.addEventListener('input', updateCharCount);
    
    // File upload
    elements.fileUpload.addEventListener('click', () => elements.fileInput.click());
    elements.fileUpload.addEventListener('dragover', handleDragOver);
    elements.fileUpload.addEventListener('drop', handleFileDrop);
    elements.fileUpload.addEventListener('dragleave', handleDragLeave);
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.removeFile.addEventListener('click', removeFile);
    
    // Action buttons
    elements.processBtn.addEventListener('click', processInput);
    elements.clearBtn.addEventListener('click', clearAll);
    elements.copyJsonBtn.addEventListener('click', copyResultsAsJson);
    elements.downloadJsonBtn.addEventListener('click', downloadResultsAsJson);
    elements.retryBtn.addEventListener('click', processInput);
}

// Tab Management
function switchTab(tabName) {
    activeTab = tabName;
    
    // Update tab buttons
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Clear other tab's data
    if (tabName === 'text') {
        removeFile();
    } else {
        elements.meetingText.value = '';
        updateCharCount();
    }
}

// Character Count
function updateCharCount() {
    const count = elements.meetingText.value.length;
    elements.charCount.textContent = count;
    
    // Update color based on limit
    if (count > 45000) {
        elements.charCount.style.color = '#dc3545';
    } else if (count > 40000) {
        elements.charCount.style.color = '#ffc107';
    } else {
        elements.charCount.style.color = '#6c757d';
    }
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    elements.fileUpload.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.fileUpload.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    elements.fileUpload.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    if (!file.name.endsWith('.txt')) {
        showError('Please select a .txt file');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }
    
    currentFile = file;
    elements.fileName.textContent = file.name;
    elements.fileUpload.style.display = 'none';
    elements.fileInfo.style.display = 'flex';
}

function removeFile() {
    currentFile = null;
    elements.fileInput.value = '';
    elements.fileUpload.style.display = 'block';
    elements.fileInfo.style.display = 'none';
}

// Input Processing
async function processInput() {
    // Validate input
    const hasText = elements.meetingText.value.trim();
    const hasFile = currentFile;
    
    if (!hasText && !hasFile) {
        showError('Please provide meeting notes either by typing or uploading a file');
        return;
    }
    
    if (hasText && hasText.length > 50000) {
        showError('Text input must be less than 50,000 characters');
        return;
    }
    
    // Show loading state
    showLoading();
    
    try {
        let response;
        
        if (activeTab === 'text' && hasText) {
            // Send text data
            response = await fetch(`${API_BASE_URL}/process-meeting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: hasText })
            });
        } else if (activeTab === 'file' && hasFile) {
            // Send file data
            const formData = new FormData();
            formData.append('file', currentFile);
            
            response = await fetch(`${API_BASE_URL}/process-meeting`, {
                method: 'POST',
                body: formData
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to process meeting notes');
        }
        
        const result = await response.json();
        lastResults = result;
        displayResults(result.data);
        
    } catch (error) {
        console.error('Processing error:', error);
        showError(error.message || 'Failed to connect to the server. Please make sure the backend is running.');
    } finally {
        hideLoading();
    }
}

// Results Display
function displayResults(data) {
    // Hide error state
    hideError();
    
    // Display summary
    elements.summaryContent.textContent = data.summary;
    
    // Display decisions
    elements.decisionsList.innerHTML = '';
    data.decisions.forEach(decision => {
        const li = document.createElement('li');
        li.textContent = decision;
        elements.decisionsList.appendChild(li);
    });
    
    // Display action items
    elements.actionItems.innerHTML = '';
    data.actionItems.forEach(item => {
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-item';
        
        actionDiv.innerHTML = `
            <div class="action-item-content">
                <div class="action-task">${escapeHtml(item.task)}</div>
                <div class="action-meta">
                    <div class="action-owner">
                        <i class="fas fa-user"></i>
                        <span>${item.owner || 'Not assigned'}</span>
                    </div>
                    <div class="action-due">
                        <i class="fas fa-calendar"></i>
                        <span>${item.due || 'No deadline'}</span>
                    </div>
                </div>
            </div>
        `;
        
        elements.actionItems.appendChild(actionDiv);
    });
    
    // Show results section
    elements.resultsSection.style.display = 'block';
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// State Management
function showLoading() {
    elements.loading.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.processBtn.disabled = true;
    elements.processBtn.classList.add('processing');
    elements.processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Start the processing messages
    startProcessingMessages();
    
    // Scroll to loading section
    elements.loading.scrollIntoView({ behavior: 'smooth' });
}

function hideLoading() {
    elements.loading.style.display = 'none';
    elements.processBtn.disabled = false;
    elements.processBtn.classList.remove('processing');
    elements.processBtn.innerHTML = '<i class="fas fa-magic"></i> Extract Meeting Minutes';
    
    // Stop the processing messages
    stopProcessingMessages();
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    hideLoading();
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Utility Functions
function clearAll() {
    // Clear text input
    elements.meetingText.value = '';
    updateCharCount();
    
    // Clear file input
    removeFile();
    
    // Hide results and errors
    elements.resultsSection.style.display = 'none';
    hideError();
    
    // Reset to text tab
    switchTab('text');
    
    lastResults = null;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copyResultsAsJson() {
    if (!lastResults) return;
    
    try {
        await navigator.clipboard.writeText(JSON.stringify(lastResults, null, 2));
        
        // Visual feedback
        const originalText = elements.copyJsonBtn.innerHTML;
        elements.copyJsonBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        elements.copyJsonBtn.style.background = '#28a745';
        
        setTimeout(() => {
            elements.copyJsonBtn.innerHTML = originalText;
            elements.copyJsonBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy to clipboard');
    }
}

function downloadResultsAsJson() {
    if (!lastResults) return;
    
    const blob = new Blob([JSON.stringify(lastResults, null, 2)], {
        type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Processing Messages
const processingMessages = [
    "🤖 AI is analyzing your meeting notes...",
    "📝 Extracting key information...",
    "🔍 Identifying decisions and action items...",
    "📊 Generating summary...",
    "⚡ Structuring results...",
    "🎯 Almost done, finalizing output...",
    "✨ Processing complete!"
];

function startProcessingMessages() {
    processingStep = 0;
    updateProcessingMessage();
    
    // Start progress simulation
    simulateProgress();
    
    // Start step transitions
    simulateProcessingSteps();
    
    // Start tip rotation
    rotateTips();
    
    processingInterval = setInterval(() => {
        processingStep = (processingStep + 1) % (processingMessages.length - 1);
        updateProcessingMessage();
    }, 2000); // Change message every 2 seconds
}

function stopProcessingMessages() {
    if (processingInterval) {
        clearInterval(processingInterval);
        processingInterval = null;
    }
    
    // Clean up all intervals
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
    }
    if (window.stepInterval) {
        clearInterval(window.stepInterval);
    }
    if (window.tipInterval) {
        clearInterval(window.tipInterval);
    }
    
    // Complete the progress bar
    updateProgress(100);
    
    // Mark all steps as completed
    ['step-1', 'step-2', 'step-3'].forEach(stepId => {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('active');
            step.classList.add('completed');
        }
    });
}

function updateProcessingMessage() {
    const loadingText = elements.loading.querySelector('p');
    if (loadingText) {
        loadingText.textContent = processingMessages[processingStep];
        loadingText.style.animation = 'none';
        setTimeout(() => {
            loadingText.style.animation = 'fadeIn 0.5s ease-in';
        }, 10);
    }
}

// Progress Bar for Long Processing
function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
        </div>
        <div class="progress-text">
            <span id="progress-percentage">0%</span>
            <span id="estimated-time">Estimated: 6-10 seconds</span>
        </div>
    `;
    return progressContainer;
}

function updateProgress(percentage) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill && progressPercentage) {
        progressFill.style.width = percentage + '%';
        progressPercentage.textContent = Math.round(percentage) + '%';
    }
}

// Progress Simulation
function simulateProgress() {
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            // Faster progress initially, then slower
            const increment = progress < 30 ? 8 : progress < 70 ? 4 : 2;
            progress += increment;
            updateProgress(progress);
        } else {
            clearInterval(progressInterval);
        }
    }, 500);
    
    // Store interval for cleanup
    window.progressInterval = progressInterval;
}

// Processing Steps Simulation
function simulateProcessingSteps() {
    const steps = ['step-1', 'step-2', 'step-3'];
    let currentStep = 0;
    
    // Reset all steps
    steps.forEach(stepId => {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Activate first step
    document.getElementById('step-1')?.classList.add('active');
    
    const stepInterval = setInterval(() => {
        if (currentStep < steps.length) {
            // Mark current step as completed
            const currentStepEl = document.getElementById(steps[currentStep]);
            currentStepEl?.classList.remove('active');
            currentStepEl?.classList.add('completed');
            
            currentStep++;
            
            // Activate next step
            if (currentStep < steps.length) {
                const nextStepEl = document.getElementById(steps[currentStep]);
                nextStepEl?.classList.add('active');
            }
        } else {
            clearInterval(stepInterval);
        }
    }, 3000); // Change step every 3 seconds
    
    // Store interval for cleanup
    window.stepInterval = stepInterval;
}

// Fun Facts for Tips
const processingTips = [
    "Did you know? Our AI processes over 1000 words per second!",
    "Fun fact: AI can identify action items with 95% accuracy!",
    "Tip: Longer meetings provide richer insights for analysis!",
    "Amazing: This AI understands context better than traditional keyword search!",
    "Insight: The AI recognizes 12 different types of meeting decisions!"
];

function rotateTips() {
    let tipIndex = 0;
    const tipInterval = setInterval(() => {
        const tipElement = document.getElementById('processing-tip-text');
        if (tipElement) {
            tipElement.style.opacity = '0';
            setTimeout(() => {
                tipElement.textContent = processingTips[tipIndex];
                tipElement.style.opacity = '1';
                tipIndex = (tipIndex + 1) % processingTips.length;
            }, 200);
        }
    }, 4000);
    
    window.tipInterval = tipInterval;
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processInput();
    }
    
    // Ctrl/Cmd + K to clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearAll();
    }
});

// Service Worker Registration (for offline capability)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
