/**
 * PII Detection Engine
 * 
 * Uses deterministic Regular Expressions for Indian context (Aadhaar, PAN, etc.)
 * For an MVP, pure Regex is fastest and runs entirely client-side.
 */

const PII_PATTERNS = [
    { type: 'AADHAAR', regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, risk: 'high' },
    { type: 'PAN', regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, risk: 'high' },
    { type: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, risk: 'medium' },
    { type: 'PHONE', regex: /\b(?:\+?91|0)?[-\s]?[6-9]\d{9}\b/g, risk: 'medium' },
    // Mocking an NER match for demo purposes (Names)
    // In a real production app, we'd use local ONNX models for NER.
    { type: 'NAME', regex: /\b(?:Rahul|Priya|Amit|Sneha)\b/gi, risk: 'low' } 
];

class PiiDetector {
    /**
     * Scans text to calculate Risk Score based on matches.
     */
    static scan(text) {
        let maxRisk = 'safe'; // safe, low, medium, high
        const matches = [];

        PII_PATTERNS.forEach(pattern => {
            const regexMatches = [...text.matchAll(pattern.regex)];
            if (regexMatches.length > 0) {
                if (pattern.risk === 'high') maxRisk = 'high';
                if (pattern.risk === 'medium' && maxRisk !== 'high') maxRisk = 'medium';
                if (pattern.risk === 'low' && maxRisk === 'safe') maxRisk = 'low';

                regexMatches.forEach(match => {
                    matches.push({ type: pattern.type, value: match[0], index: match.index });
                });
            }
        });

        return { riskLevel: maxRisk, matches };
    }

    /**
     * Anonymizes text using the PrivacyVault mappings.
     */
    static anonymize(text, vault) {
        let anonymizedText = text;
        
        // We iterate through patterns and replace using the global vault instance
        PII_PATTERNS.forEach(pattern => {
            anonymizedText = anonymizedText.replace(pattern.regex, (match) => {
                return vault.tokenize(match, pattern.type);
            });
        });

        return anonymizedText;
    }
}
