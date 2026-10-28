import { sendText, sendButtons } from "./whatsapp";

// Mensaje entrante ya simplificado por el webhook
export type Incoming = {
  from: string; // número del cliente, ej: 5491112345678
  name?: string; // nombre de perfil de WhatsApp
  text?: string; // si escribió texto
  buttonId?: string; // si tocó un botón
};

const MENU = [
  { id: "eventos", title: "🎧 Eventos" },
  { id: "clases", title: "🎓 Clases de DJ" },
  { id: "humano", title: "💬 Hablar con Segundo" },
];

export async function handleMessage(msg: Incoming) {
  const { from, name, buttonId } = msg;
  const text = msg.text?.trim().toLowerCase() ?? "";

  // 1. El cliente tocó un botón del menú
  if (buttonId === "eventos") {
    return sendText(
      from,
      "¡Genial! Para armarte el presupuesto mandame en un solo mensaje:\n\n" +
        "📅 Fecha del evento\n" +
        "📍 Lugar / zona\n" +
        "👥 Cantidad de invitados\n" +
        "🎉 Tipo de evento (cumple, casamiento, corporativo...)\n" +
        "🔊 Qué necesitás: DJ, sonido, iluminación o todo"
    );
  }

  if (buttonId === "clases") {
    return sendText(
      from,
      "🎓 *Curso de DJ para principiantes*\n\n" +
        "Clases presenciales en Nordelta y San Isidro (Texas Sound).\n" +
        "Contame qué días y horarios te quedan cómodos y te paso disponibilidad y precio."
    );
  }

  if (buttonId === "humano") {
    return sendText(
      from,
      "Listo 🙌 Le aviso a Segundo y te responde personalmente en breve."
    );
  }

  // 2. Palabras clave básicas
  if (/(precio|presupuesto|cotiz)/.test(text)) {
    return handleMessage({ ...msg, buttonId: "eventos" });
  }
  if (/(clase|curso|aprender)/.test(text)) {
    return handleMessage({ ...msg, buttonId: "clases" });
  }

  // 3. Cualquier otra cosa → menú principal
  const saludo = name ? `¡Hola ${name.split(" ")[0]}!` : "¡Hola!";
  return sendButtons(
    from,
    `${saludo} 👋 Bienvenido a *ABUNDANCE Productions*.\n¿En qué te puedo ayudar?`,
    MENU
  );
}
