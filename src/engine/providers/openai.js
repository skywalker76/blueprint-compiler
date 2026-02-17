// ─── OPENAI PROVIDER (GPT-4o) ───
import { BaseProvider } from "./base.js";

export class OpenAIProvider extends BaseProvider {
    constructor() {
        super({
            id: "openai",
            name: "OpenAI (GPT-4o)",
            icon: "🟢",
            model: "gpt-4o",
            maxTokens: 8000,
            keyPlaceholder: "sk-proj-...",
            keyHelpUrl: "https://platform.openai.com/api-keys",
            keyPrefix: "sk-",
        });
    }

    async call(apiKey, systemPrompt, userPrompt) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: this.maxTokens,
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
        // OpenAI keys start with "sk-" (project keys: "sk-proj-", legacy: "sk-...")
        return apiKey.startsWith("sk-") && apiKey.length > 20;
    }
}
