// ─── GEMINI PROVIDER (Google) ───
import { BaseProvider } from "./base.js";

export class GeminiProvider extends BaseProvider {
    constructor() {
        super({
            id: "gemini",
            name: "Google Gemini",
            icon: "✨",
            models: [
                { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Best for complex reasoning & coding", maxTokens: 8192 },
                { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fastest and cost-efficient", maxTokens: 8192 },
                { id: "gemini-2.0-pro-exp-02-05", name: "Gemini 2.0 Pro Experimental", description: "Experimental pro model", maxTokens: 8192 },
                { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Fast tier model", maxTokens: 8192 },
            ],
            defaultModel: "gemini-2.5-pro",
            keyPlaceholder: "AIzaSy...",
            keyHelpUrl: "https://aistudio.google.com/app/apikey",
            keyPrefix: "AIza",
        });
    }

    async call(apiKey, systemPrompt, userPrompt, modelId) {
        const model = this.getModel(modelId);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    role: "user",
                    parts: [{ text: userPrompt }]
                }],
                generationConfig: {
                    maxOutputTokens: model.maxTokens,
                }
            }),
        });

        const data = await res.json();
        if (data.error) {
            throw new Error(data.error.message || "Unknown Gemini Error");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
}
