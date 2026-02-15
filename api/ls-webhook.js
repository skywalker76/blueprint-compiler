// ─── LEMON SQUEEZY WEBHOOK HANDLER ───
// Vercel serverless function: POST /api/ls-webhook
// Verifies HMAC signature using RAW body, then updates Supabase profile tier.

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Disable Vercel's automatic body parsing so we get the raw body for HMAC
export const config = {
    api: {
        bodyParser: false,
    },
};

const WEBHOOK_SECRET = process.env.LS_WEBHOOK_SECRET;
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Read raw body from request stream ───
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

// ─── Map event types to tier ───
function determineTier(payload) {
    const variantId = String(
        payload.data?.attributes?.variant_id ||
        payload.data?.attributes?.first_subscription_item?.variant_id
    );
    if (variantId === "1310993") return "team";
    if (variantId === "1310969") return "pro";
    return "pro"; // fallback for any valid subscription
}

const TIER_MAP = {
    subscription_created: determineTier,
    subscription_updated: determineTier,
    subscription_resumed: determineTier,
    subscription_cancelled: () => "free",
    subscription_expired: () => "free",
};

// ─── HMAC Verification ───
function verifySignature(rawBody, signature) {
    if (!WEBHOOK_SECRET || !signature) return false;
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = hmac.update(rawBody).digest("hex");
    try {
        return crypto.timingSafeEqual(
            Buffer.from(digest),
            Buffer.from(signature)
        );
    } catch {
        return false;
    }
}

// ─── Handler ───
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Read the RAW body (before any parsing)
    const rawBody = await getRawBody(req);
    console.log("[Webhook] Received body length:", rawBody.length);

    // Verify HMAC signature using raw body
    const signature = req.headers["x-signature"];
    console.log("[Webhook] Signature header:", signature ? "present" : "MISSING");

    if (!verifySignature(rawBody, signature)) {
        console.error("[Webhook] Invalid HMAC signature");
        return res.status(401).json({ error: "Invalid signature" });
    }

    // Parse payload from raw body
    const payload = JSON.parse(rawBody);
    const eventType = payload.meta?.event_name;
    console.log(`[Webhook] Event: ${eventType}`);

    // Only handle subscription events
    const tierResolver = TIER_MAP[eventType];
    if (!tierResolver) {
        console.log(`[Webhook] Ignoring event: ${eventType}`);
        return res.status(200).json({ ok: true, ignored: true });
    }

    // Extract user_id from custom_data
    const userId = payload.meta?.custom_data?.user_id;
    if (!userId) {
        console.error("[Webhook] Missing user_id in custom_data");
        return res.status(400).json({ error: "Missing user_id" });
    }

    // Determine tier
    const tier = typeof tierResolver === "function"
        ? tierResolver(payload)
        : tierResolver;

    // Extract subscription details
    const customerId = String(payload.data?.attributes?.customer_id || "");
    const status = payload.data?.attributes?.status || "";

    console.log(`[Webhook] user=${userId} tier=${tier} status=${status}`);

    try {
        // Update profile
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                tier,
                stripe_customer_id: customerId,
            })
            .eq("id", userId);

        if (profileError) {
            console.error("[Webhook] Profile update failed:", profileError.message);
            return res.status(500).json({ error: "Profile update failed" });
        }

        // Log event
        await supabase.from("subscription_events").insert({
            user_id: userId,
            event_type: eventType,
            ls_event_id: payload.meta?.webhook_id || "",
            details: {
                tier,
                status,
                variant_id: payload.data?.attributes?.variant_id,
                customer_id: customerId,
            },
        });

        console.log(`[Webhook] ✅ Updated user ${userId} → tier=${tier}`);
        return res.status(200).json({ ok: true, tier });
    } catch (err) {
        console.error("[Webhook] Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
