const FEATURES = [
  {
    title: "Presupuestos en 5 pasos",
    text: "Pide fecha, lugar, invitados, tipo de evento y servicio con botones interactivos, y confirma el resumen antes de enviarlo.",
  },
  {
    title: "Leads guardados",
    text: "Cada pedido queda en Supabase (Postgres) y se ve en un panel privado en /admin.",
  },
  {
    title: "Aviso al instante",
    text: "Cuando entra un pedido, el bot le avisa a Segundo por WhatsApp con todos los datos.",
  },
  {
    title: "Seguro por diseño",
    text: "Verifica la firma HMAC-SHA256 de Meta en cada webhook y evita respuestas duplicadas.",
  },
];

const STACK = ["Next.js 15", "TypeScript", "WhatsApp Cloud API", "Supabase", "Vercel", "Vitest"];

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow">ABUNDANCE Productions · WhatsApp Bot</p>
        <h1>
          Un bot que convierte chats
          <br />
          en presupuestos de eventos.
        </h1>
        <p className="lead-text">
          Atiende 24/7 a quienes escriben por WhatsApp, arma el pedido de
          presupuesto paso a paso y lo deja listo para responder.
        </p>
        <div className="status">
          <span className="dot" /> Online · webhook en <code>/api/webhook</code>
        </div>
      </section>

      <section className="chat" aria-label="Ejemplo de conversación">
        <p className="msg in">Hola! Quería un presupuesto para un cumple</p>
        <p className="msg out">¡Genial! 🎧 Te hago 5 preguntas rápidas…<br /><b>1/5</b> ¿Para qué fecha es el evento?</p>
        <p className="msg in">Sábado 14 de diciembre</p>
        <p className="msg out"><b>5/5</b> ¿Qué servicio necesitás?</p>
        <div className="buttons">
          <span>Solo DJ</span>
          <span>DJ + Sonido</span>
          <span>DJ+Sonido+Luces</span>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <article key={f.title}>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="foot">
        <ul className="stack">
          {STACK.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p>
          Hecho por <a href="https://portfolio-segundo.vercel.app/">Segundo Pinto</a> ·{" "}
          <a href="https://github.com/djpinto2/abundance-bot">Código en GitHub</a> ·{" "}
          <a href="/privacidad">Privacidad</a>
        </p>
      </footer>
    </main>
  );
}
