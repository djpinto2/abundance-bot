// Cliente mínimo de la WhatsApp Cloud API
const VERSION = process.env.GRAPH_API_VERSION ?? "v23.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const TOKEN = process.env.WHATSAPP_TOKEN!;

const URL = `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`;

// Los números argentinos llegan como 549 11 XXXXXXXX, pero en modo prueba
// Meta los guarda como 54 11 15 XXXXXXXX. Sin esta conversión aparece el
// error 131030 "Recipient phone number not in allowed list".
// (Cubre área 11 / AMBA; para otras áreas agregalas a la lista.)
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
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) {
    console.error("Error WhatsApp API:", res.status, await res.text());
  }
}

export function sendText(to: string, text: string) {
  return send({ to, type: "text", text: { body: text } });
}

// Botones de respuesta rápida (máximo 3, título de hasta 20 caracteres)
export function sendButtons(
  to: string,
  text: string,
  buttons: { id: string; title: string }[]
) {
  return send({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export function markAsRead(messageId: string) {
  return send({ status: "read", message_id: messageId });
}
