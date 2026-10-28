import { beforeEach, describe, expect, it } from "vitest";
import { handleMessage, type BotDeps } from "@/lib/bot";
import { createMemoryStore } from "@/lib/store";

type Sent = { to: string; text: string; buttons?: string[] };

function setup() {
  const sent: Sent[] = [];
  const admin: string[] = [];
  const deps: BotDeps = {
    store: createMemoryStore(),
    sendText: async (to, text) => void sent.push({ to, text }),
    sendButtons: async (to, text, buttons) =>
      void sent.push({ to, text, buttons: buttons.map((b) => b.id) }),
    notifyAdmin: async (text) => void admin.push(text),
  };
  const last = () => sent[sent.length - 1];
  const say = (text: string) => handleMessage({ from: "5491100000000", name: "Ana Pérez", text }, deps);
  const tap = (buttonId: string) => handleMessage({ from: "5491100000000", name: "Ana Pérez", buttonId }, deps);
  return { deps, sent, admin, last, say, tap };
}

describe("main menu", () => {
  it("greets by first name and shows 3 buttons", async () => {
    const { last, say } = setup();
    await say("buenas");
    expect(last().text).toContain("¡Hola Ana!");
    expect(last().buttons).toEqual(["eventos", "clases", "humano"]);
  });

  it("'menu' resets the conversation from any step", async () => {
    const { last, say, tap } = setup();
    await tap("eventos");
    await say("menu");
    expect(last().buttons).toEqual(["eventos", "clases", "humano"]);
  });

  it("asks for text when it receives audio or images", async () => {
    const { deps, last } = setup();
    await handleMessage({ from: "5491100000000", unsupported: true }, deps);
    expect(last().text).toContain("solo entiendo mensajes de texto");
  });
});

describe("event quote flow", () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => (t = setup()));

  async function completeUntilConfirm() {
    await t.tap("eventos");
    await t.say("14 de diciembre");
    await t.say("Salón Nordelta");
    await t.say("unas 120 personas");
    await t.say("Casamiento");
    await t.tap("srv_full");
  }

  it("walks through the 5 questions and shows a summary", async () => {
    await completeUntilConfirm();
    const summary = t.last();
    expect(summary.text).toContain("14 de diciembre");
    expect(summary.text).toContain("Invitados: 120");
    expect(summary.text).toContain("DJ + Sonido + Iluminación");
    expect(summary.buttons).toEqual(["confirmar", "reiniciar"]);
  });

  it("re-asks when the guest count has no number", async () => {
    await t.tap("eventos");
    await t.say("mañana");
    await t.say("Palermo");
    await t.say("muchos");
    expect(t.last().text).toContain("número aproximado");
  });

  it("re-asks the service if the user types instead of tapping", async () => {
    await t.tap("eventos");
    await t.say("viernes");
    await t.say("San Isidro");
    await t.say("50");
    await t.say("Cumpleaños");
    await t.say("quiero todo");
    expect(t.last().buttons).toEqual(["srv_dj", "srv_dj_sonido", "srv_full"]);
  });

  it("saves the lead and notifies the admin on confirm", async () => {
    await completeUntilConfirm();
    await t.tap("confirmar");

    const leads = await t.deps.store.listLeads();
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      type: "evento",
      phone: "5491100000000",
      data: { invitados: "120", servicio: "srv_full" },
    });
    expect(t.admin[0]).toContain("Pedido de presupuesto");
    expect(t.last().text).toContain("Recibimos tu pedido");
  });

  it("does not save anything if the user restarts", async () => {
    await completeUntilConfirm();
    await t.tap("reiniciar");
    expect(await t.deps.store.listLeads()).toHaveLength(0);
  });
});

describe("other flows", () => {
  it("saves a class inquiry", async () => {
    const t = setup();
    await t.tap("clases");
    await t.say("martes y jueves a la tarde, Nordelta");
    const [lead] = await t.deps.store.listLeads();
    expect(lead).toMatchObject({ type: "clase", data: { disponibilidad: "martes y jueves a la tarde, Nordelta" } });
    expect(t.admin).toHaveLength(1);
  });

  it("routes keywords: 'presupuesto' starts the event flow", async () => {
    const t = setup();
    await t.say("quiero un presupuesto");
    expect(t.last().text).toContain("1/5");
  });

  it("hands off to a human and saves the message", async () => {
    const t = setup();
    await t.tap("humano");
    await t.say("tengo una consulta sobre equipos");
    const [lead] = await t.deps.store.listLeads();
    expect(lead.type).toBe("contacto");
    expect(t.admin[0]).toContain("Quiere hablar con vos");
  });
});
