// Persistence layer: Supabase (via its REST API, no SDK needed) when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set; in-memory otherwise.
// The in-memory store is fine for local dev and tests, but on serverless it
// only lives while the instance stays warm — use Supabase in production.

export type Session = {
  phone: string;
  step: string;
  data: Record<string, string>;
  updated_at?: string;
};

export type LeadType = "evento" | "clase" | "contacto";

export type Lead = {
  id?: string;
  created_at?: string;
  phone: string;
  name?: string;
  type: LeadType;
  data: Record<string, string>;
  status?: string;
};

export interface Store {
  getSession(phone: string): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  saveLead(lead: Lead): Promise<void>;
  listLeads(limit?: number): Promise<Lead[]>;
}

// ---------- In-memory ----------
export function createMemoryStore(): Store {
  const sessions = new Map<string, Session>();
  const leads: Lead[] = [];

  return {
    async getSession(phone) {
      return sessions.get(phone) ?? null;
    },
    async saveSession(session) {
      sessions.set(session.phone, {
        ...session,
        updated_at: new Date().toISOString(),
      });
    },
    async saveLead(lead) {
      leads.unshift({
        ...lead,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        status: "nuevo",
      });
    },
    async listLeads(limit = 100) {
      return leads.slice(0, limit);
    },
  };
}

// ---------- Supabase ----------
export function createSupabaseStore(url: string, key: string): Store {
  const rest = `${url.replace(/\/$/, "")}/rest/v1`;
  // Legacy service_role keys are JWTs (eyJ...) and go in both headers.
  // New secret keys (sb_secret_...) are not JWTs: send them only as apikey.
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

  async function call(path: string, init: RequestInit = {}) {
    const res = await fetch(`${rest}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`[supabase] ${res.status} ${await res.text()}`);
    }
    return res;
  }

  return {
    async getSession(phone) {
      const res = await call(
        `/sessions?phone=eq.${encodeURIComponent(phone)}&select=*`
      );
      const rows = (await res.json()) as Session[];
      return rows[0] ?? null;
    },
    async saveSession(session) {
      await call("/sessions", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          ...session,
          updated_at: new Date().toISOString(),
        }),
      });
    },
    async saveLead(lead) {
      await call("/leads", { method: "POST", body: JSON.stringify(lead) });
    },
    async listLeads(limit = 100) {
      const res = await call(
        `/leads?select=*&order=created_at.desc&limit=${limit}`
      );
      return (await res.json()) as Lead[];
    },
  };
}

// ---------- Singleton ----------
let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    store = url && key ? createSupabaseStore(url, key) : createMemoryStore();
  }
  return store;
}

export function isPersistent() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
