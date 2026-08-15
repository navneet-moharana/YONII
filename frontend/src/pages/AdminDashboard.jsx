import React from "react";
import { useNavigate } from "react-router-dom";
import { http, setAdminToken } from "@/lib/api";
import { TID } from "@/constants/testIds";
import { LogOut, TrendingUp, MessageCircle, Camera, IndianRupee } from "lucide-react";

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="card-soft bg-white p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--yonii-muted)]">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="mt-3 font-display text-3xl tracking-tight">{value}</div>
      {hint && <div className="text-xs text-[var(--yonii-muted)] mt-1">{hint}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState(null);
  const [chats, setChats] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [kb, setKb] = React.useState([]);
  const [form, setForm] = React.useState({ title: "", body: "", source_url: "", category: "" });
  const [err, setErr] = React.useState("");
  const nav = useNavigate();

  const load = React.useCallback(async () => {
    try {
      const [s, c, p, k] = await Promise.all([
        http.get("/admin/stats"),
        http.get("/admin/recent-chats"),
        http.get("/admin/recent-payments"),
        http.get("/admin/knowledge"),
      ]);
      setStats(s.data); setChats(c.data.chats); setPayments(p.data.payments); setKb(k.data.items);
    } catch (e) {
      if (e?.response?.status === 401) {
        setAdminToken(null);
        nav("/admin/login");
      } else {
        setErr("Failed to load admin data.");
      }
    }
  }, [nav]);

  React.useEffect(() => { load(); }, [load]);

  const logout = () => { setAdminToken(null); nav("/admin/login"); };

  const addKB = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    await http.post("/admin/knowledge", form);
    setForm({ title: "", body: "", source_url: "", category: "" });
    load();
  };

  const delKB = async (id) => {
    await http.delete(`/admin/knowledge/${id}`);
    load();
  };

  return (
    <div className="yonii-container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">YONII</div>
          <h1 className="font-display text-3xl tracking-tight">Admin dashboard</h1>
        </div>
        <button data-testid={TID.admin.logout} onClick={logout} className="btn-outline inline-flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      {err && <div className="text-sm text-[var(--yonii-accent)] mb-4">{err}</div>}

      {stats && (
        <div data-testid={TID.admin.statsPanel} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={MessageCircle} label="Total chats" value={stats.total_chats} hint={`${stats.metrics?.chat_messages || 0} messages`} />
          <Stat icon={Camera} label="Image analyses" value={stats.total_image_analyses} />
          <Stat icon={IndianRupee} label="Revenue" value={`₹${Number(stats.revenue_inr || 0).toFixed(0)}`} hint={`${stats.payments_verified} verified payments`} />
          <Stat icon={TrendingUp} label="Payments mode" value={stats.mock_payments ? "MOCK" : "LIVE"} hint={stats.mock_payments ? "Add Razorpay keys to go live" : "Razorpay live"} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card-soft bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Recent chats</div>
          <ul className="divide-y divide-[var(--yonii-border)] text-sm">
            {chats.map((c, i) => (
              <li key={i} className="py-2.5">
                <div className="text-[var(--yonii-text)] line-clamp-2">{c.question}</div>
                <div className="text-xs text-[var(--yonii-muted)] flex gap-3 mt-1">
                  <span className="uppercase tracking-widest">{c.verdict}</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
            {chats.length === 0 && <li className="text-[var(--yonii-muted)] text-sm py-4">No chats yet.</li>}
          </ul>
        </div>

        <div className="card-soft bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Recent payments</div>
          <ul className="divide-y divide-[var(--yonii-border)] text-sm">
            {payments.map((p, i) => (
              <li key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs">{p.order_id}</div>
                  <div className="text-xs text-[var(--yonii-muted)]">{p.status} · ₹{(p.amount / 100).toFixed(0)}{p.mock ? " · mock" : ""}</div>
                </div>
                <div className="text-xs text-[var(--yonii-muted)]">{new Date(p.created_at).toLocaleString()}</div>
              </li>
            ))}
            {payments.length === 0 && <li className="text-[var(--yonii-muted)] text-sm py-4">No payments yet.</li>}
          </ul>
        </div>
      </div>

      <div className="card-soft bg-white p-5 mt-6">
        <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Medical knowledge base</div>
        <form onSubmit={addKB} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                 className="bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" />
          <input placeholder="Category (e.g. STI, Contraception)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                 className="bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" />
          <input placeholder="Source URL (WHO, CDC…)" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                 className="bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none md:col-span-2" />
          <textarea placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                    className="bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none md:col-span-2 min-h-24" />
          <button type="submit" className="btn-primary md:col-span-2 md:w-fit">Add entry</button>
        </form>
        <ul className="mt-5 divide-y divide-[var(--yonii-border)] text-sm">
          {kb.map((k) => (
            <li key={k.id} className="py-3 flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{k.title} <span className="text-xs text-[var(--yonii-muted)]">· {k.category}</span></div>
                <div className="text-xs text-[var(--yonii-muted)] mt-0.5 line-clamp-2">{k.body}</div>
                {k.source_url && <a href={k.source_url} target="_blank" rel="noreferrer" className="text-xs link-underline">{k.source_url}</a>}
              </div>
              <button onClick={() => delKB(k.id)} className="text-xs text-[var(--yonii-accent)]">Delete</button>
            </li>
          ))}
          {kb.length === 0 && <li className="text-[var(--yonii-muted)] text-sm py-4">No entries yet.</li>}
        </ul>
      </div>
    </div>
  );
}
