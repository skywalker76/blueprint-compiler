// ─── OPENAI PROVIDER (GPT) ───
import { BaseProvider } from "./base.js";

export class OpenAIProvider extends BaseProvider {
    constructor() {
        super({
            id: "openai",
            name: "OpenAI",
            icon: "🟢",
            models: [
                { id: "gpt-4o", name: "GPT-4o", description: "Fast multimodal, best value", maxTokens: 8000 },
                { id: "gpt-4.1", name: "GPT-4.1", description: "Latest, highest quality", maxTokens: 8000 },
                { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Cheapest, good for testing", maxTokens: 8000 },
                { id: "o3-mini", name: "o3-mini", description: "Reasoning model, slower", maxTokens: 8000 },
            ],
            defaultModel: "gpt-4o",
            keyPlaceholder: "sk-proj-...",
            keyHelpUrl: "https://platform.openai.com/api-keys",
            keyPrefix: "sk-",
        });
    }

    async call(apiKey, systemPrompt, userPrompt, modelId) {
        const model = this.getModel(modelId);
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model.id,
                max_tokens: model.maxTokens,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message?.message || data.error.message || "OpenAI API error");
        return data.choices?.[0]?.message?.content || "";
    }

    validateKey(apiKey) {
        if (!apiKey || typeof apiKey !== "string") return false;
        return apiKey.startsWith("sk-") && apiKey.length > 20;
    }
}
