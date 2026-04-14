/**
 * Privacy Vault (Zero-Persistence State Manager)
 * 
 * Securely holds PII mappings in RAM only.
 * Designed to be forcibly wiped after every transaction.
 */
class PrivacyVault {
    constructor() {
        this.memoryMap = new Map();
        this.counters = {}; // Tracks sequence numbers like <PAN_1>, <PAN_2>
    }

    /**
     * Stores a sensitive string and returns a safe token.
     */
    tokenize(piiText, type) {
        // Find existing to reuse token if the same PII appears twice
        for (let [token, value] of this.memoryMap.entries()) {
            if (value === piiText) return token;
        }

        if (!this.counters[type]) this.counters[type] = 1;
        const tokenId = `<${type}_${this.counters[type]++}>`;
        this.memoryMap.set(tokenId, piiText);
        
        this.updateUI();
        return tokenId;
    }

    /**
     * Replaces tokens in AI response with original PII from RAM.
     */
    restore(text) {
        let restoredText = text;
        for (let [token, realValue] of this.memoryMap.entries()) {
            // Use regex with global flag to replace all instances of the token
            const regex = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            restoredText = restoredText.replace(regex, realValue);
        }
        return restoredText;
    }

    /**
     * Immediate Execution Deletion. 
     * Erases all traces from RAM.
     */
    clear() {
        this.memoryMap.clear();
        this.counters = {};
        this.updateUI();
    }

    /**
     * Secure read-only access for the UI Inspector (Demonstration purposes)
     */
    getSnapshot() {
        return Object.fromEntries(this.memoryMap);
    }

    // Connects to the Network Inspector UI
    updateUI() {
        const display = document.getElementById('vaultDisplay');
        const status = document.getElementById('vaultStatusText');
        if (!display) return;

        if (this.memoryMap.size === 0) {
            display.textContent = "{ }";
            status.textContent = "Wiped clean.";
            display.style.color = "var(--status-green)";
        } else {
            display.textContent = JSON.stringify(this.getSnapshot(), null, 2);
            status.textContent = "Holding volatile data...";
            display.style.color = "var(--status-yellow)";
        }
    }
}

// Global generic instance for MVP
const vault = new PrivacyVault();
