// ─── ANTHROPIC PROVIDER (Claude) ───
import { BaseProvider } from "./base.js";

export class AnthropicProvider extends BaseProvider {
    constructor() {
        super({
            id: "anthropic",
            name: "Anthropic (Claude)",
            icon: "🟠",
            model: "claude-sonnet-4-20250514",
            maxTokens: 8000,
            keyPlaceholder: "sk-ant-api03-...",
            keyHelpUrl: "https://console.anthropic.com/",
            keyPrefix: "sk-ant-",
        });
    }

    async call(apiKey, systemPrompt, userPrompt) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
                system: systemPrompt,
                messages: [{ role: "user", content: userPrompt }],
            }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.content?.map(b => b.text || "").join("\n") || "";
    }
}
