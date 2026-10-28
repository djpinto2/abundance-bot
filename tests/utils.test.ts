import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeAR } from "@/lib/whatsapp";
import { verifySignature } from "@/lib/signature";

describe("normalizeAR", () => {
  it("converts 549 11 XXXXXXXX to 54 11 15 XXXXXXXX", () => {
    expect(normalizeAR("5491149695304")).toBe("54111549695304");
  });

  it("leaves other numbers untouched", () => {
    expect(normalizeAR("5215512345678")).toBe("5215512345678");
    expect(normalizeAR("14155550123")).toBe("14155550123");
  });
});

describe("verifySignature", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ hello: "world" });
  const valid = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a correctly signed body", () => {
    expect(verifySignature(body, valid, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifySignature(body + " ", valid, secret)).toBe(false);
  });

  it("rejects a missing or malformed header", () => {
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, "md5=abc", secret)).toBe(false);
  });
});
