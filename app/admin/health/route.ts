import { NextResponse } from "next/server";
import { isPersistent } from "@/lib/store";

export const dynamic = "force-dynamic";

// Diagnostics for the WhatsApp connection. Protected by the /admin Basic Auth
// middleware. Never returns secrets: only a masked hint of the token in use.
export async function GET() {
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

  return NextResponse.json({
    token: tokenInfo,
    phoneNumberId: phoneId || null,
    graphApiVersion: version,
    supabase: isPersistent(),
    metaCheck: meta,
  });
}
