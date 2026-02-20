// ─── PROVIDER REGISTRY ───
// Central registry for all LLM providers.
// Import this file anywhere you need to work with providers.

import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";

// ─── Instantiate all providers ───
const anthropic = new AnthropicProvider();
const openai = new OpenAIProvider();
const gemini = new GeminiProvider();

// ─── Registry map ───
export const PROVIDERS = {
    anthropic,
    openai,
    gemini,
};

// ─── Ordered list for UI dropdowns ───
export const PROVIDER_LIST = [anthropic, openai, gemini];

// ─── Factory ───
export function getProvider(id) {
    const provider = PROVIDERS[id];
    if (!provider) {
        console.warn(`Unknown provider "${id}", falling back to Anthropic`);
        return PROVIDERS.anthropic;
    }
    return provider;
}

// ─── Default provider ───
export const DEFAULT_PROVIDER = "anthropic";
