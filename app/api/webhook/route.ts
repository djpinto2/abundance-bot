import { NextRequest, NextResponse } from "next/server";
import { handleMessage, type Incoming } from "@/lib/bot";
import { markAsRead } from "@/lib/whatsapp";
import { verifySignature } from "@/lib/signature";

export const dynamic = "force-dynamic";

// GET: Meta calls this once to verify the webhook URL
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta retries a webhook if it doesn't get a fast 200, so the same message
// can arrive twice. Remember recent ids to avoid answering twice.
const seen = new Set<string>();
function alreadySeen(id: string) {
  if (seen.has(id)) return true;
  seen.add(id);
  if (seen.size > 500) seen.delete(seen.values().next().value as string);
  return false;
}

// POST: every incoming message and delivery status lands here
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Security: only accept requests signed by Meta (when the secret is configured)
  const secret = process.env.META_APP_SECRET;
  if (secret && !verifySignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    const value = JSON.parse(raw)?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // "statuses" events (sent, delivered, read) have no message: ignore them
    if (message && !alreadySeen(message.id)) {
      const incoming: Incoming = {
        from: message.from,
        name: value.contacts?.[0]?.profile?.name,
      };

      if (message.type === "text") incoming.text = message.text?.body;
      else if (message.type === "interactive") incoming.buttonId = message.interactive?.button_reply?.id;
      else if (message.type === "button") incoming.text = message.button?.text;
      else incoming.unsupported = true;

      // Run in parallel: the "read" receipt shouldn't delay the reply
      await Promise.all([markAsRead(message.id), handleMessage(incoming)]);
    }
  } catch (err) {
    console.error("[webhook] error", err);
  }

  return NextResponse.json({ ok: true });
}
