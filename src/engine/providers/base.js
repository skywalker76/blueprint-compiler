// ─── BASE LLM PROVIDER ───
// Abstract interface for all LLM providers.
// Each provider must implement the `call()` method and define available `models`.

export class BaseProvider {
    constructor({ id, name, icon, models, defaultModel, keyPlaceholder, keyHelpUrl, keyPrefix }) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.models = models; // Array of { id, name, description, maxTokens }
        this.defaultModel = defaultModel;
        this.keyPlaceholder = keyPlaceholder;
        this.keyHelpUrl = keyHelpUrl;
        this.keyPrefix = keyPrefix;
    }

    /**
     * Call the LLM API with system + user prompt.
     * @param {string} apiKey - User's API key
     * @param {string} systemPrompt - System prompt for context
     * @param {string} userPrompt - User prompt for generation
     * @param {string} modelId - Model to use (optional, defaults to provider's default)
     * @returns {Promise<string>} - Generated text
     */
    async call(apiKey, systemPrompt, userPrompt, modelId) {
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

    /**
     * Get model config by ID, fallback to default.
     */
    getModel(modelId) {
        return this.models.find(m => m.id === modelId) || this.models.find(m => m.id === this.defaultModel) || this.models[0];
    }
}
