import { NextRequest, NextResponse } from "next/server";
import { handleMessage } from "@/lib/bot";
import { markAsRead } from "@/lib/whatsapp";

// GET: Meta lo llama UNA vez para verificar el webhook
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

// POST: Meta manda acá cada mensaje que te escriben
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // También llegan "statuses" (entregado, leído). Esos los ignoramos.
    if (message) {
      const contact = value.contacts?.[0];

      await markAsRead(message.id);
      await handleMessage({
        from: message.from,
        name: contact?.profile?.name,
        text: message.type === "text" ? message.text?.body : undefined,
        buttonId:
          message.type === "interactive"
            ? message.interactive?.button_reply?.id
            : undefined,
      });
    }
  } catch (err) {
    console.error("Error procesando webhook:", err);
  }

  // Siempre devolver 200 rápido, si no Meta reintenta el envío
  return NextResponse.json({ ok: true });
}
