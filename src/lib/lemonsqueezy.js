// ─── LEMON SQUEEZY INTEGRATION ───
// Checkout overlay helper — opens LS payment modal without leaving the page.

const LS_STORE_ID = "293675";

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
 * The script adds `window.createLemonSqueezy()` globally.
 */
function ensureLemonSqueezyScript() {
    return new Promise((resolve, reject) => {
        if (window.LemonSqueezy) {
            resolve();
            return;
        }

        // Check if script is already loading
        if (document.querySelector('script[src*="lmsqueezy"]')) {
            const wait = setInterval(() => {
                if (window.LemonSqueezy) {
                    clearInterval(wait);
                    resolve();
                }
            }, 100);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://app.lemonsqueezy.com/js/lemon.js";
        script.defer = true;
        script.onload = () => {
            window.createLemonSqueezy?.();
            resolve();
        };
        script.onerror = () => reject(new Error("Failed to load Lemon Squeezy script"));
        document.head.appendChild(script);
    });
}

/**
 * Open the Lemon Squeezy checkout overlay for a given plan.
 *
 * @param {"pro"|"team"} planKey     — which plan to checkout
 * @param {string}       email      — user email for pre-fill
 * @param {string}       userId     — Supabase user id, sent as custom data
 * @param {Function}     onSuccess  — optional callback after successful checkout
 */
export async function openCheckout(planKey, email, userId, onSuccess) {
    const plan = PLANS[planKey];
    if (!plan) throw new Error(`Unknown plan: ${planKey}`);

    await ensureLemonSqueezyScript();

    // Build checkout URL with overlay mode
    const checkoutUrl = new URL(
        `https://blueprint-compiler.lemonsqueezy.com/buy/${plan.variantId}`
    );

    // Pre-fill email & pass userId as custom data
    checkoutUrl.searchParams.set("checkout[email]", email);
    checkoutUrl.searchParams.set("checkout[custom][user_id]", userId);

    // Dark theme to match our UI
    checkoutUrl.searchParams.set("dark", "1");

    // Embed mode — opens as overlay
    checkoutUrl.searchParams.set("embed", "1");

    // Use the LemonSqueezy.Url.Open method for overlay
    if (window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(checkoutUrl.toString());
    } else {
        // Fallback: open in new tab
        window.open(checkoutUrl.toString(), "_blank");
    }

    // Optional: listen for checkout success event
    if (onSuccess) {
        window.addEventListener(
            "message",
            function handler(event) {
                if (
                    event.origin === "https://app.lemonsqueezy.com" &&
                    event.data?.event === "Checkout.Success"
                ) {
                    window.removeEventListener("message", handler);
                    onSuccess(event.data);
                }
            }
        );
    }
}
