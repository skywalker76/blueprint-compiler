// ─── BASE LLM PROVIDER ───
// Abstract interface for all LLM providers.
// Each provider must implement the `call()` method.

export class BaseProvider {
    constructor({ id, name, icon, model, maxTokens, keyPlaceholder, keyHelpUrl, keyPrefix }) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.model = model;
        this.maxTokens = maxTokens;
        this.keyPlaceholder = keyPlaceholder;
        this.keyHelpUrl = keyHelpUrl;
        this.keyPrefix = keyPrefix; // e.g. "sk-ant-" or "sk-" for quick validation
    }

    /**
     * Call the LLM API with system + user prompt.
     * @param {string} apiKey - User's API key
     * @param {string} systemPrompt - System prompt for context
     * @param {string} userPrompt - User prompt for generation
     * @returns {Promise<string>} - Generated text
     */
    async call(apiKey, systemPrompt, userPrompt) {
        throw new Error(`Provider "${this.id}" must implement call()`);
    }

    /**
     * Quick client-side key format validation.
     * @param {string} apiKey
     * @returns {boolean}
     */
    validateKey(apiKey) {
        if (!apiKey || typeof apiKey !== "string") return false;
        if (this.keyPrefix) return apiKey.startsWith(this.keyPrefix);
        return apiKey.length > 10;
    }
}
