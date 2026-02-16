// ─── CREATE CHECKOUT ───
// Vercel serverless function that creates a Lemon Squeezy checkout URL
// via their API, then returns it to the client to open.

export default async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { variantId, email, userId } = req.body || {};

    if (!variantId) {
        return res.status(400).json({ error: "variantId is required" });
    }

    const LS_API_KEY = process.env.LS_API_KEY;
    if (!LS_API_KEY) {
        return res.status(500).json({ error: "LS_API_KEY not configured" });
    }

    try {
        const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
            method: "POST",
            headers: {
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": `Bearer ${LS_API_KEY}`,
            },
            body: JSON.stringify({
                data: {
                    type: "checkouts",
                    attributes: {
                        checkout_data: {
                            email: email || undefined,
                            custom: userId ? { user_id: userId } : undefined,
                        },
                        checkout_options: {
                            embed: true,
                            dark: true,
                        },
                        redirect_url: "https://blueprint-compiler.vercel.app/app?upgraded=true",
                        product_options: {
                            enabled_variants: [parseInt(variantId)],
                        },
                    },
                    relationships: {
                        store: {
                            data: {
                                type: "stores",
                                id: "293675",
                            },
                        },
                        variant: {
                            data: {
                                type: "variants",
                                id: String(variantId),
                            },
                        },
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Checkout] LS API error:", response.status, errorText);
            return res.status(502).json({
                error: "Failed to create checkout",
                details: errorText,
            });
        }

        const result = await response.json();
        const checkoutUrl = result.data?.attributes?.url;

        if (!checkoutUrl) {
            console.error("[Checkout] No URL in response:", JSON.stringify(result));
            return res.status(502).json({ error: "No checkout URL returned" });
        }

        console.log("[Checkout] Created:", checkoutUrl);
        return res.status(200).json({ url: checkoutUrl });
    } catch (err) {
        console.error("[Checkout] Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
