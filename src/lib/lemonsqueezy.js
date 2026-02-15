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
 * Returns a promise that resolves when the script is loaded and initialized.
 */
function ensureLemonSqueezyScript() {
    return new Promise((resolve, reject) => {
        // Already initialized
        if (window.LemonSqueezy) {
            resolve();
            return;
        }

        // Script already in DOM but not yet initialized
        if (document.querySelector('script[src*="lemonsqueezy"]')) {
            const wait = setInterval(() => {
                if (window.createLemonSqueezy) {
                    clearInterval(wait);
                    window.createLemonSqueezy();
                    // Give it a moment to initialize
                    setTimeout(resolve, 200);
                }
            }, 100);
            // Timeout after 5s
            setTimeout(() => {
                clearInterval(wait);
                reject(new Error("Lemon Squeezy script timed out"));
            }, 5000);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://app.lemonsqueezy.com/js/lemon.js";
        script.defer = true;
        script.onload = () => {
            // createLemonSqueezy initializes the global LemonSqueezy object
            if (window.createLemonSqueezy) {
                window.createLemonSqueezy();
            }
            // Give it a moment to fully initialize
            setTimeout(resolve, 300);
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

    // Build checkout URL
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

    try {
        await ensureLemonSqueezyScript();

        // Use the LemonSqueezy.Url.Open method for overlay
        if (window.LemonSqueezy && window.LemonSqueezy.Url) {
            console.log("[LS] Opening overlay checkout:", checkoutUrl.toString());
            window.LemonSqueezy.Url.Open(checkoutUrl.toString());
        } else {
            // Fallback: open in new tab
            console.warn("[LS] Overlay not available, opening in new tab");
            window.open(checkoutUrl.toString(), "_blank");
        }
    } catch (err) {
        console.warn("[LS] Script load failed, opening in new tab:", err.message);
        // Fallback: open in new tab (works without the overlay script)
        window.open(checkoutUrl.toString(), "_blank");
    }

    // Listen for checkout success event from the overlay
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
