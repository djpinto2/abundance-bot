// Minimal WhatsApp Cloud API client
const VERSION = process.env.GRAPH_API_VERSION ?? "v23.0";

function endpoint() {
  return `https://graph.facebook.com/${VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

// Argentine numbers arrive as 549 11 XXXXXXXX, but in test mode Meta stores
// them in the allowed list as 54 11 15 XXXXXXXX. Without this conversion the
// API answers error 131030 "Recipient phone number not in allowed list".
// Covers area code 11 (Buenos Aires / AMBA); add more area codes as needed.
const AR_AREAS = ["11"];

export function normalizeAR(num: string) {
  for (const area of AR_AREAS) {
    const prefix = `549${area}`;
    if (num.startsWith(prefix)) {
      return `54${area}15${num.slice(prefix.length)}`;
    }
  }
  return num;
}

async function send(body: Record<string, unknown>) {
  if (typeof body.to === "string") body.to = normalizeAR(body.to);

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN?.trim().replace(/^["']|["']$/g, "")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!res.ok) {
    console.error("[whatsapp] API error", res.status, await res.text());
  }
}

export function sendText(to: string, text: string) {
  return send({ to, type: "text", text: { body: text } });
}

export type Button = { id: string; title: string };

// Quick-reply buttons: max 3, title up to 20 characters
export function sendButtons(to: string, text: string, buttons: Button[]) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

export function markAsRead(messageId: string) {
  return send({ status: "read", message_id: messageId });
}
