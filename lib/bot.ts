import { sendButtons, sendText, type Button } from "./whatsapp";
import { getStore, type Lead, type Session, type Store } from "./store";

// ---------- Types ----------

export type Incoming = {
  from: string; // customer's WhatsApp number, e.g. 5491112345678
  name?: string; // WhatsApp profile name
  text?: string; // typed text
  buttonId?: string; // id of the tapped quick-reply button
  unsupported?: boolean; // audio, image, sticker...
};

// Everything the bot needs from the outside world. Injected so the
// conversation logic can be unit-tested without hitting real APIs.
export type BotDeps = {
  store: Store;
  sendText: (to: string, text: string) => Promise<void>;
  sendButtons: (to: string, text: string, buttons: Button[]) => Promise<void>;
  notifyAdmin: (text: string) => Promise<void>;
};

export function defaultDeps(): BotDeps {
  return {
    store: getStore(),
    sendText,
    sendButtons,
    notifyAdmin: async (text) => {
      const admin = process.env.ADMIN_PHONE;
      // Note: WhatsApp only delivers free-form messages inside the 24 h
      // customer-service window, so the admin should have written to the
      // bot at least once in the last 24 h (or use an approved template).
      if (admin) await sendText(admin, text);
      else console.log("[lead]", text);
    },
  };
}

// ---------- Copy ----------

const MAIN_MENU: Button[] = [
  { id: "eventos", title: "🎧 Eventos" },
  { id: "clases", title: "🎓 Clases de DJ" },
  { id: "humano", title: "💬 Hablar con Segundo" },
];

const SERVICES: Button[] = [
  { id: "srv_dj", title: "Solo DJ" },
  { id: "srv_dj_sonido", title: "DJ + Sonido" },
  { id: "srv_full", title: "DJ+Sonido+Luces" },
];

const SERVICE_LABEL: Record<string, string> = {
  srv_dj: "Solo DJ",
  srv_dj_sonido: "DJ + Sonido",
  srv_full: "DJ + Sonido + Iluminación",
};

const CONFIRM: Button[] = [
  { id: "confirmar", title: "✅ Confirmar" },
  { id: "reiniciar", title: "🔄 Empezar de nuevo" },
];

const RESET_WORDS = /^(menu|menú|inicio|hola|cancelar|salir|volver)$/;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // a stale conversation restarts after 2 h

// ---------- Helpers ----------

function firstName(name?: string) {
  return name?.trim().split(/\s+/)[0];
}

function isExpired(session: Session) {
  if (!session.updated_at) return false;
  return Date.now() - new Date(session.updated_at).getTime() > SESSION_TTL_MS;
}

function eventSummary(d: Record<string, string>) {
  return (
    `📅 Fecha: ${d.fecha}\n` +
    `📍 Lugar: ${d.zona}\n` +
    `👥 Invitados: ${d.invitados}\n` +
    `🎉 Tipo: ${d.tipo}\n` +
    `🔊 Servicio: ${SERVICE_LABEL[d.servicio] ?? d.servicio}`
  );
}

// ---------- Main handler ----------

export async function handleMessage(msg: Incoming, deps: BotDeps = defaultDeps()) {
  const { store } = deps;
  const phone = msg.from;
  const text = msg.text?.trim() ?? "";
  const lower = text.toLowerCase();
  const button = msg.buttonId;

  let session = (await store.getSession(phone)) ?? { phone, step: "idle", data: {} };
  if (isExpired(session)) session = { phone, step: "idle", data: {} };

  const go = async (step: string, data = session.data) => {
    session = { phone, step, data };
    await store.saveSession(session);
  };

  const showMenu = async (intro?: string) => {
    const hi = firstName(msg.name) ? `¡Hola ${firstName(msg.name)}!` : "¡Hola!";
    await deps.sendButtons(
      phone,
      intro ?? `${hi} 👋 Bienvenido a *ABUNDANCE Productions*.\n¿En qué te puedo ayudar?`,
      MAIN_MENU
    );
    await go("menu", {});
  };

  const saveLead = async (type: Lead["type"], data: Record<string, string>) => {
    await store.saveLead({ phone, name: msg.name, type, data });
  };

  // --- Global commands (work from any step) ---
  if (button === "reiniciar" || RESET_WORDS.test(lower)) return showMenu();

  if (msg.unsupported) {
    return deps.sendText(
      phone,
      "Por ahora solo entiendo mensajes de texto 🙏 Escribí *menu* para ver las opciones."
    );
  }

  // --- Main menu choices (buttons, numbers or keywords) ---
  const wantsEvent =
    button === "eventos" || lower === "1" || /(presupuesto|cotiz|precio|evento|fiesta)/.test(lower);
  const wantsClass = button === "clases" || lower === "2" || /(clase|curso|aprender)/.test(lower);
  const wantsHuman = button === "humano" || lower === "3" || /(humano|persona|segundo)/.test(lower);

  if (session.step === "idle" || session.step === "menu") {
    if (wantsEvent) {
      await deps.sendText(
        phone,
        "¡Genial! 🎧 Te hago 5 preguntas rápidas para armarte el presupuesto.\n\n*1/5* ¿Para qué fecha es el evento?"
      );
      return go("ev_fecha", {});
    }
    if (wantsClass) {
      await deps.sendText(
        phone,
        "🎓 *Curso de DJ para principiantes*\n\n" +
          "Clases presenciales en *Nordelta* y *San Isidro* (Texas Sound), con equipos profesionales.\n\n" +
          "¿Qué días y horarios te quedan cómodos, y qué sede preferís?"
      );
      return go("cl_disponibilidad", {});
    }
    if (wantsHuman) {
      await deps.sendText(phone, "Dale 🙌 Contame brevemente en qué te puedo ayudar y se lo paso a Segundo.");
      return go("hm_motivo", {});
    }
    return showMenu();
  }

  // --- Event quote flow ---
  switch (session.step) {
    case "ev_fecha":
      await deps.sendText(phone, "*2/5* ¿En qué zona o salón es?");
      return go("ev_zona", { ...session.data, fecha: text });

    case "ev_zona":
      await deps.sendText(phone, "*3/5* ¿Cuántos invitados aproximadamente?");
      return go("ev_invitados", { ...session.data, zona: text });

    case "ev_invitados": {
      const n = text.match(/\d+/)?.[0];
      if (!n) return deps.sendText(phone, "Pasame un número aproximado, por ejemplo *80* 🙂");
      await deps.sendText(
        phone,
        "*4/5* ¿Qué tipo de evento es? (cumpleaños, casamiento, corporativo, fiesta privada...)"
      );
      return go("ev_tipo", { ...session.data, invitados: n });
    }

    case "ev_tipo":
      await deps.sendButtons(phone, "*5/5* ¿Qué servicio necesitás?", SERVICES);
      return go("ev_servicio", { ...session.data, tipo: text });

    case "ev_servicio": {
      if (!button || !SERVICE_LABEL[button]) {
        return deps.sendButtons(phone, "Elegí una de las opciones 👇", SERVICES);
      }
      const data = { ...session.data, servicio: button };
      await deps.sendButtons(phone, `Perfecto, revisá los datos:\n\n${eventSummary(data)}`, CONFIRM);
      return go("ev_confirmar", data);
    }

    case "ev_confirmar": {
      if (button !== "confirmar") {
        return deps.sendButtons(phone, "¿Confirmamos el pedido?", CONFIRM);
      }
      await saveLead("evento", session.data);
      await deps.notifyAdmin(
        `🆕 *Pedido de presupuesto*\n👤 ${msg.name ?? "Sin nombre"} (+${phone})\n\n${eventSummary(session.data)}`
      );
      await deps.sendText(
        phone,
        "¡Listo! ✅ Recibimos tu pedido. Segundo te manda el presupuesto por acá en menos de 24 h.\n\nEscribí *menu* si necesitás algo más."
      );
      return go("idle", {});
    }

    // --- DJ classes ---
    case "cl_disponibilidad":
      await saveLead("clase", { disponibilidad: text });
      await deps.notifyAdmin(
        `🎓 *Interesado en clases*\n👤 ${msg.name ?? "Sin nombre"} (+${phone})\n🗓 ${text}`
      );
      await deps.sendText(phone, "¡Anotado! 🙌 Segundo te escribe con días disponibles y precio.");
      return go("idle", {});

    // --- Talk to a human ---
    case "hm_motivo":
      await saveLead("contacto", { motivo: text });
      await deps.notifyAdmin(`💬 *Quiere hablar con vos*\n👤 ${msg.name ?? "Sin nombre"} (+${phone})\n📝 ${text}`);
      await deps.sendText(phone, "Gracias 🙏 Ya le avisé a Segundo, te responde personalmente en breve.");
      return go("idle", {});

    default:
      return showMenu();
  }
}
