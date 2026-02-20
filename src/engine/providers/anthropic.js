// ─── ANTHROPIC PROVIDER (Claude) ───
import { BaseProvider } from "./base.js";

export class AnthropicProvider extends BaseProvider {
    constructor() {
        super({
            id: "anthropic",
            name: "Anthropic",
            icon: "🟠",
            models: [
                { id: "claude-opus-4-20250514", name: "Claude Opus 4.5", description: "Potente, ottimo per ragionamenti complessi", maxTokens: 8000 },
                { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4.5", description: "Il più usato e stabile", maxTokens: 8000 },
                { id: "claude-3-5-haiku-20241022", name: "Claude Haiku", description: "Veloce ed economico", maxTokens: 8000 },
            ],
            defaultModel: "claude-opus-4-20250514",
            keyPlaceholder: "sk-ant-api03-...",
            keyHelpUrl: "https://console.anthropic.com/",
            keyPrefix: "sk-ant-",
        });
    }

    async call(apiKey, systemPrompt, userPrompt, modelId) {
        const model = this.getModel(modelId);
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: model.id,
                max_tokens: model.maxTokens,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.content?.map(b => b.text || "").join("\n") || "";
    }
}
