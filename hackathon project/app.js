/**
 * Application Logic Binding
 * Glues the UI, the Privacy Middleware, and the AI Client together.
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatDisplay = document.getElementById('chatDisplay');
    const explainPanel = document.getElementById('explainPanel');
    
    // Header Elements
    const riskBadge = document.getElementById('riskBadge');
    const riskText = document.getElementById('riskText');
    
    // Inspector Elements
    const outgoingPayload = document.getElementById('outgoingPayload');
    const incomingPayload = document.getElementById('incomingPayload');

    // Settings Modal Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const aiProvider = document.getElementById('aiProvider');
    const apiKeyInput = document.getElementById('apiKey');

    // Local State
    let currentProvider = localStorage.getItem('aiProvider') || 'gemini';
    let currentApiKey = localStorage.getItem('apiKey') || '';
    
    // Initialization
    aiProvider.value = currentProvider;
    apiKeyInput.value = currentApiKey;

    // ----- SETTINGS MODAL LOGIC -----
    settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    
    saveSettingsBtn.addEventListener('click', () => {
        currentProvider = aiProvider.value;
        currentApiKey = apiKeyInput.value.trim();
        localStorage.setItem('aiProvider', currentProvider);
        localStorage.setItem('apiKey', currentApiKey);
        settingsModal.classList.remove('active');
    });

    // ----- REAL-TIME PII DETECTION -----
    promptInput.addEventListener('input', (e) => {
        const text = e.target.value;
        if (!text.trim()) {
            resetRiskUI();
            return;
        }

        const scanResult = PiiDetector.scan(text);
        
        // Update Risk Badge
        riskBadge.className = `risk-badge badge-${scanResult.riskLevel === 'high' ? 'red' : (scanResult.riskLevel === 'medium' ? 'yellow' : 'green')}`;
        riskText.textContent = scanResult.riskLevel === 'safe' 
            ? 'Safe (No PII)' 
            : `Risk: ${scanResult.riskLevel.toUpperCase()}`;

        // Update Explainability Panel
        if (scanResult.matches.length > 0) {
            explainPanel.innerHTML = `<span class="highlight-pii">Detected ${scanResult.matches.length} sensitive item(s). Will be anonymized before sending.</span>`;
        } else {
            explainPanel.innerHTML = '<span class="explain-text">Real-time PII scan active...</span>';
        }
    });

    function resetRiskUI() {
        riskBadge.className = 'risk-badge badge-green';
        riskText.textContent = 'Safe (No PII)';
        explainPanel.innerHTML = '<span class="explain-text">Real-time PII scan active...</span>';
    }

    // ----- CHAT LOGIC -----
    function appendMessage(text, sender) {
        const el = document.createElement('div');
        el.className = `message ${sender === 'user' ? 'user-msg' : 'system-msg'}`;
        
        const avatarIcon = sender === 'user' ? 'user' : 'shield';
        el.innerHTML = `
            <div class="msg-avatar"><i data-feather="${avatarIcon}"></i></div>
            <div class="msg-content">${text.replace(/\n/g, '<br>')}</div>
        `;
        chatDisplay.appendChild(el);
        feather.replace();
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }

    // ----- CORE TRANSACTION LOGIC (SEND) -----
    sendBtn.addEventListener('click', async () => {
        const originalText = promptInput.value.trim();
        if (!originalText) return;

        // 1. Show user message in UI immediately
        appendMessage(originalText, 'user');
        promptInput.value = '';
        resetRiskUI();
        
        // Button loading state
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>Processing</span> <i data-feather="loader" class="spin"></i>`;
        feather.replace();

        // 2. Anonymize (The Core Security Feature)
        // vault is the global instance from privacyVault.js
        const anonymizedPayload = PiiDetector.anonymize(originalText, vault);
        
        // Update Network Inspector OUTGOING
        outgoingPayload.textContent = anonymizedPayload;
        outgoingPayload.innerHTML = outgoingPayload.innerHTML.replace(/(&lt;[A-Z]+_\d+&gt;)/g, '<span class="highlight-token">$1</span>');

        // 3. Send over network
        incomingPayload.textContent = "Waiting for response...";
        const rawResponse = await LlmClient.generateResponse(currentProvider, currentApiKey, anonymizedPayload);

        // Update Network Inspector INCOMING
        incomingPayload.textContent = rawResponse;
        incomingPayload.innerHTML = incomingPayload.innerHTML.replace(/(&lt;[A-Z]+_\d+&gt;)/g, '<span class="highlight-token">$1</span>');

        // 4. Restore original PII from RAM Vault
        const restoredResponse = vault.restore(rawResponse);

        // 5. Present restored response to user
        appendMessage(restoredResponse, 'system');

        // 6. ZERO PERSISTENCE: Wipe the vault
        vault.clear();

        // Reset Button
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span>Process Securely</span> <i data-feather="send"></i>`;
        feather.replace();
    });

    // Handle 'Enter' key
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // Initial Vault UI render
    vault.updateUI();
});
