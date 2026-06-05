// In-memory IP tracking for Rate Limiting
const rateLimitMap = new Map();

export async function onRequestPost(context) {
    // 1. Get the user's true IP address from Cloudflare
    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();

    // 2. STRICT IP RATE LIMITING (Max 1 message per 60 seconds per IP)
    if (rateLimitMap.has(ip)) {
        if (now - rateLimitMap.get(ip) < 60000) {
            return new Response("Rate limit exceeded", { status: 429 });
        }
    }
    rateLimitMap.set(ip, now);

    try {
        const data = await context.request.json();
        
        if (!data.name || !data.context || !data.message) {
            return new Response("Missing required fields", { status: 400 });
        }

        // 3. SECURE DISCORD WEBHOOK (Hidden from the frontend)
        const WEBHOOK_URL = "https://discord.com/api/webhooks/1511826859699081316/TeBvwurk9kCPOTmdUTDaz2bVpjUJznA-FxAb5G4Skxsd4WAjNr4OvzxuEcjBenIS-zzs";

        // 4. FORMAT THE DISCORD MESSAGE (Using a sleek hacker-style embed box)
        const discordPayload = {
            embeds: [{
                title: "🔒 NEW SECURE TRANSMISSION",
                color: 16104971, // Amber/Gold color
                fields: [
                    { name: "Identifier", value: data.name, inline: true },
                    { name: "Context", value: data.context, inline: true },
                    { name: "Network IP", value: ip, inline: false },
                    { name: "Message payload", value: data.message, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };

        // 5. SEND TO DISCORD
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) return new Response("Discord API Error", { status: 500 });

        return new Response(JSON.stringify({ success: true }), { 
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response("Internal Server Error", { status: 500 });
    }
}

