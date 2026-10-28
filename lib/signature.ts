import { createHmac, timingSafeEqual } from "node:crypto";

// Meta signs every webhook with your App Secret:
//   X-Hub-Signature-256: sha256=<HMAC-SHA256 of the raw body>
// Verifying it guarantees the request really comes from Meta.
export function verifySignature(
  rawBody: string,
  header: string | null,
  appSecret: string
): boolean {
  if (!header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = header.slice("sha256=".length);

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
