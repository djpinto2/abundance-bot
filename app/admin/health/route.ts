import { NextResponse } from "next/server";
import { isPersistent } from "@/lib/store";
import { normalizeAR } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// Diagnostics for the WhatsApp connection. Protected by the /admin Basic Auth
// middleware. Never returns secrets: only a masked hint of the token in use.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const testTo = params.get("to"); // optional: send a test message to this number
  const testMode = params.get("mode") === "text" ? "text" : "template";
  const token = process.env.WHATSAPP_TOKEN ?? "";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  const version = process.env.GRAPH_API_VERSION ?? "v23.0";

  const trimmed = token.trim();
  const tokenInfo = {
    present: token.length > 0,
    length: token.length,
    hint: trimmed ? `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}` : null,
    hasSurroundingSpaces: token !== trimmed,
    hasQuotes: /^["']|["']$/.test(trimmed),
  };

  let meta: unknown = null;
  if (trimmed && phoneId) {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${phoneId}?fields=display_phone_number,verified_name,quality_rating`,
      { headers: { Authorization: `Bearer ${trimmed}` }, cache: "no-store" }
    );
    meta = { status: res.status, body: await res.json().catch(() => null) };
  }

  // Optional real send, to see Meta's exact answer for outgoing messages.
  // mode=template sends Meta's pre-approved "hello_world" (works outside the
  // 24 h window); mode=text sends free text (needs an open 24 h window).
  let sendCheck: unknown = null;
  if (testTo && trimmed && phoneId) {
    const to = normalizeAR(testTo.replace(/\D/g, ""));
    const payload =
      testMode === "text"
        ? { type: "text", text: { body: "Prueba de diagnóstico ✅" } }
        : { type: "template", template: { name: "hello_world", language: { code: "en_US" } } };
    const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${trimmed}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload }),
      cache: "no-store",
    });
    sendCheck = { to, mode: testMode, status: res.status, body: await res.json().catch(() => null) };
  }

  return NextResponse.json({
    sendCheck,
    token: tokenInfo,
    phoneNumberId: phoneId || null,
    graphApiVersion: version,
    supabase: isPersistent(),
    metaCheck: meta,
  });
}
