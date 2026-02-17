// ─── ANTHROPIC PROVIDER (Claude) ───
import { BaseProvider } from "./base.js";

export class AnthropicProvider extends BaseProvider {
    constructor() {
        super({
            id: "anthropic",
            name: "Anthropic",
            icon: "🟠",
            models: [
                { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", description: "Best balance speed/quality", maxTokens: 8000 },
                { id: "claude-opus-4-20250514", name: "Claude Opus 4", description: "Most powerful, slower", maxTokens: 8000 },
                { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest, cheapest", maxTokens: 8000 },
            ],
            defaultModel: "claude-sonnet-4-20250514",
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
