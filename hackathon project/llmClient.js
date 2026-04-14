/**
 * LLM Integration Client
 * Handles communication with AI providers under a Zero-Trust setup.
 */

class LlmClient {
    /**
     * Sends the anonymized payload to the selected AI provider.
     * Fallbacks to a mock engine if no key is provided.
     */
    static async generateResponse(provider, apiKey, anonymizedPrompt) {
        if (!apiKey) {
            return this.mockEchoResponse(anonymizedPrompt);
        }

        if (provider === 'gemini') {
            return this.callGemini(apiKey, anonymizedPrompt);
        } else if (provider === 'openai') {
            return this.callOpenAI(apiKey, anonymizedPrompt);
        } else {
            throw new Error("Unknown provider.");
        }
    }

    /**
     * Fallback mock response for Hackathon Demo if the internet fails.
     */
    static mockEchoResponse(prompt) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Securely processed document. Acknowledged: ${prompt}`);
            }, 1200); // simulate network latency
        });
    }

    /**
     * Calls Google Gemini API (gemini-1.5-pro-latest)
     */
    static async callGemini(apiKey, prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error("Gemini API Error:", error);
            return `API Error: ${error.message}`;
        }
    }

    /**
     * Calls OpenAI Chat Completions API
     */
    static async callOpenAI(apiKey, prompt) {
        const url = `https://api.openai.com/v1/chat/completions`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices[0].message.content;

        } catch (error) {
            console.error("OpenAI API Error:", error);
            return `API Error: ${error.message}`;
        }
    }
}
