import { getStore, isPersistent, type Lead } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · ABUNDANCE Bot" };

const TYPE_LABEL: Record<Lead["type"], string> = {
  evento: "🎧 Evento",
  clase: "🎓 Clase",
  contacto: "💬 Contacto",
};

const FIELD_LABEL: Record<string, string> = {
  fecha: "Fecha",
  zona: "Lugar",
  invitados: "Invitados",
  tipo: "Tipo",
  servicio: "Servicio",
  disponibilidad: "Disponibilidad",
  motivo: "Mensaje",
};

const SERVICE_LABEL: Record<string, string> = {
  srv_dj: "Solo DJ",
  srv_dj_sonido: "DJ + Sonido",
  srv_full: "DJ + Sonido + Luces",
};

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminPage() {
  let leads: Lead[] = [];
  let error = "";
  try {
    leads = await getStore().listLeads(200);
  } catch (e) {
    error = e instanceof Error ? e.message : "Error al leer los leads";
  }

  const counts = {
    evento: leads.filter((l) => l.type === "evento").length,
    clase: leads.filter((l) => l.type === "clase").length,
    contacto: leads.filter((l) => l.type === "contacto").length,
  };

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="eyebrow">ABUNDANCE Bot</p>
          <h1>Leads</h1>
        </div>
        <span className={`pill ${isPersistent() ? "ok" : "warn"}`}>
          {isPersistent() ? "Supabase conectado" : "Modo memoria (sin Supabase)"}
        </span>
      </header>

      <section className="stats">
        <div><strong>{leads.length}</strong><span>Total</span></div>
        <div><strong>{counts.evento}</strong><span>Eventos</span></div>
        <div><strong>{counts.clase}</strong><span>Clases</span></div>
        <div><strong>{counts.contacto}</strong><span>Contactos</span></div>
      </section>

      {error && <p className="error">{error}</p>}

      {leads.length === 0 && !error ? (
        <p className="empty">Todavía no hay leads. Escribile al bot para probar 🙂</p>
      ) : (
        <ul className="leads">
          {leads.map((lead) => (
            <li key={lead.id} className="lead">
              <div className="lead-top">
                <span className="tag">{TYPE_LABEL[lead.type]}</span>
                <time>{formatDate(lead.created_at)}</time>
              </div>
              <p className="who">
                {lead.name ?? "Sin nombre"} ·{" "}
                <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer">
                  +{lead.phone}
                </a>
              </p>
              <dl>
                {Object.entries(lead.data).map(([k, v]) => (
                  <div key={k}>
                    <dt>{FIELD_LABEL[k] ?? k}</dt>
                    <dd>{k === "servicio" ? SERVICE_LABEL[v] ?? v : v}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
