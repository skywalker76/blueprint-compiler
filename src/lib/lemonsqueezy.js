// ─── LEMON SQUEEZY INTEGRATION ───
// Checkout helper — creates checkout via API, then opens overlay or new tab.

export const PLANS = {
    pro: {
        name: "Pro",
        variantId: "1310969",
        price: 19,
    },
    team: {
        name: "Team",
        variantId: "1310993",
        price: 49,
    },
};

/**
 * Load the Lemon Squeezy overlay script (idempotent).
 */
function ensureLemonSqueezyScript() {
    return new Promise((resolve, reject) => {
        if (window.LemonSqueezy) {
            resolve();
            return;
        }

        if (document.querySelector('script[src*="lemonsqueezy"]')) {
            const wait = setInterval(() => {
                if (window.createLemonSqueezy) {
                    clearInterval(wait);
                    window.createLemonSqueezy();
                    setTimeout(resolve, 300);
                }
            }, 100);
            setTimeout(() => { clearInterval(wait); reject(new Error("Timeout")); }, 5000);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://app.lemonsqueezy.com/js/lemon.js";
        script.defer = true;
        script.onload = () => {
            if (window.createLemonSqueezy) window.createLemonSqueezy();
            setTimeout(resolve, 300);
        };
        script.onerror = () => reject(new Error("Failed to load LS script"));
        document.head.appendChild(script);
    });
}

/**
 * Open the Lemon Squeezy checkout for a given plan.
 * 1. Calls our server-side API to create a checkout URL via LS API
 * 2. Tries to open as overlay (if LS script loaded)
 * 3. Falls back to new tab
 *
 * @param {"pro"|"team"} planKey
 * @param {string}       email
 * @param {string}       userId
 * @param {Function}     onSuccess
 */
export async function openCheckout(planKey, email, userId, onSuccess) {
    const plan = PLANS[planKey];
    if (!plan) throw new Error(`Unknown plan: ${planKey}`);

    // Step 1: Create checkout via our API
    console.log("[LS] Creating checkout for", planKey, "...");

    const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            variantId: plan.variantId,
            email,
            userId,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("[LS] Checkout creation failed:", err);
        throw new Error(err.error || "Checkout creation failed");
    }

    const { url: checkoutUrl } = await response.json();
    console.log("[LS] Checkout URL:", checkoutUrl);

    // Step 2: Try overlay, fallback to new tab
    try {
        await ensureLemonSqueezyScript();
        if (window.LemonSqueezy && window.LemonSqueezy.Url) {
            console.log("[LS] Opening overlay...");
            window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
            console.warn("[LS] Overlay unavailable, opening new tab");
            window.open(checkoutUrl, "_blank");
        }
    } catch (scriptErr) {
        console.warn("[LS] Script error, opening new tab:", scriptErr.message);
        window.open(checkoutUrl, "_blank");
    }

    // Step 3: Listen for success event
    if (onSuccess) {
        window.addEventListener("message", function handler(event) {
            if (
                event.origin === "https://app.lemonsqueezy.com" &&
                event.data?.event === "Checkout.Success"
            ) {
                window.removeEventListener("message", handler);
                onSuccess(event.data);
            }
        });
    }
}
