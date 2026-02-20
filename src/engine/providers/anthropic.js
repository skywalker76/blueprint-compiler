// ─── ANTHROPIC PROVIDER (Claude) ───
import { BaseProvider } from "./base.js";

export class AnthropicProvider extends BaseProvider {
    constructor() {
        super({
            id: "anthropic",
            name: "Anthropic",
            icon: "🟠",
            models: [
                { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "🆕 Newest & most intelligent", maxTokens: 8192 },
                { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (4.5)", description: "Very fast, highly capable", maxTokens: 8192 },
                { id: "claude-3-opus-20240229", name: "Claude 3 Opus (4.5)", description: "Powerful, excellent for complex reasoning", maxTokens: 4096 },
                { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest, cheapest", maxTokens: 8192 },
            ],
            defaultModel: "claude-3-7-sonnet-20250219",
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
