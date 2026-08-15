import React from "react";
import { http } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import { TID } from "@/constants/testIds";
import { CalendarDays, Droplet, LogOut, Plus, Trash2, Sparkles, ShieldCheck } from "lucide-react";

const TOKEN_KEY = "yonii_period_token";
const EMAIL_KEY = "yonii_period_email";

function useAuth() {
  const [token, setToken] = React.useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [email, setEmail] = React.useState(() => localStorage.getItem(EMAIL_KEY) || "");

  const login = React.useCallback((t, e) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(EMAIL_KEY, e);
    setToken(t); setEmail(e);
  }, []);
  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(""); setEmail("");
  }, []);
  return { token, email, login, logout };
}

function withAuth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ---- Auth panel (sign up / log in) ---------------------------------------
function AuthPanel({ onAuthed }) {
  const [mode, setMode] = React.useState("signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const path = mode === "signup" ? "/period/signup" : "/period/login";
      const { data } = await http.post(path, { email, password });
      onAuthed(data.token, data.email);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto card-soft bg-white p-8">
      <div className="flex items-center gap-2 mb-4">
        <Droplet className="w-4 h-4 text-[var(--yonii-accent)]" />
        <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Period Tracker</div>
      </div>
      <h2 className="font-display text-2xl mb-2">{mode === "signup" ? "Create your private account" : "Welcome back"}</h2>
      <p className="text-sm text-[var(--yonii-muted)] mb-4">
        An account is <span className="text-[var(--yonii-primary)] font-medium">only</span> used to save your period entries securely. Everything else on YONII stays anonymous.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input data-testid="period-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 className="mt-1.5 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium">Password (min 6)</label>
          <input data-testid="period-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                 className="mt-1.5 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
        <button data-testid={mode === "signup" ? "period-signup-submit" : "period-login-submit"}
                type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
      <div className="mt-4 text-sm text-[var(--yonii-muted)]">
        {mode === "signup" ? (
          <>Already have an account?{" "}
            <button data-testid="period-switch-login" className="link-underline text-[var(--yonii-primary)]" onClick={() => setMode("login")}>Log in</button>
          </>
        ) : (
          <>New here?{" "}
            <button data-testid="period-switch-signup" className="link-underline text-[var(--yonii-primary)]" onClick={() => setMode("signup")}>Create an account</button>
          </>
        )}
      </div>
      <div className="mt-6 flex items-start gap-2 text-xs text-[var(--yonii-muted)]">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-[var(--yonii-primary)]" />
        <span>Only your period entries are stored. Chats, image analyses and other YONII features remain fully anonymous.</span>
      </div>
    </div>
  );
}

// ---- Simple calendar highlighting period + fertile days ------------------
function MiniCalendar({ prediction, entries }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(); d.setDate(1); return d; });

  const inRange = (dateStr, startStr, endStr) => dateStr >= startStr && dateStr <= endStr;

  const periodRanges = entries
    .filter((e) => e.start_date)
    .map((e) => ({ start: e.start_date, end: e.end_date || e.start_date }));

  const start = new Date(month);
  const startWeekday = start.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0, 10);
    let tag = "";
    if (prediction && prediction.has_data) {
      if (iso === prediction.next_period_start) tag = "next";
      else if (inRange(iso, prediction.fertile_window_start, prediction.fertile_window_end)) tag = "fertile";
      else if (iso === prediction.predicted_ovulation) tag = "ovulation";
    }
    for (const r of periodRanges) if (inRange(iso, r.start, r.end)) tag = "period";
    cells.push({ d, iso, tag });
  }

  const label = month.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="card-soft bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <button className="btn-outline text-xs px-3 py-1" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>Prev</button>
        <div className="font-display text-lg">{label}</div>
        <button className="btn-outline text-xs px-3 py-1" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--yonii-muted)] mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => (
          <div key={i} className="aspect-square flex items-center justify-center rounded-lg text-sm"
               style={
                 c === null ? {} :
                 c.tag === "period" ? { background: "#C15C3D", color: "white" } :
                 c.tag === "next"   ? { background: "#F4C7B8", color: "#3d1a10" } :
                 c.tag === "ovulation" ? { background: "#2B4434", color: "white" } :
                 c.tag === "fertile" ? { background: "rgba(43,68,52,0.15)", color: "#1a1c1a" } :
                 { color: "#1a1c1a" }
               }>
            {c && c.d}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[var(--yonii-muted)]">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--yonii-accent)]" /> Logged period</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#F4C7B8" }} /> Next period (predicted)</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "rgba(43,68,52,0.35)" }} /> Fertile window</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--yonii-primary)]" /> Ovulation day</div>
      </div>
    </div>
  );
}

// ---- Dashboard (post-auth) -----------------------------------------------
function Dashboard({ token, email, onLogout }) {
  const [entries, setEntries] = React.useState([]);
  const [prediction, setPrediction] = React.useState(null);
  const [form, setForm] = React.useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    flow: "",
    notes: "",
  });
  const [err, setErr] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const [e, p] = await Promise.all([
        http.get("/period/entries", withAuth(token)),
        http.get("/period/prediction", withAuth(token)),
      ]);
      setEntries(e.data.entries || []);
      setPrediction(p.data);
    } catch (ex) {
      if (ex?.response?.status === 401) onLogout();
    }
  }, [token, onLogout]);

  React.useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await http.post("/period/entries", {
        start_date: form.start_date,
        end_date: form.end_date || null,
        flow: form.flow || null,
        notes: form.notes || null,
      }, withAuth(token));
      setForm({ start_date: new Date().toISOString().slice(0, 10), end_date: "", flow: "", notes: "" });
      load();
    } catch (ex) {
      setErr(ex?.response?.data?.detail || "Could not save. Please try again.");
    }
  };

  const del = async (id) => {
    await http.delete(`/period/entries/${id}`, withAuth(token));
    load();
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Signed in</div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">{email}</h1>
          <p className="text-sm text-[var(--yonii-muted)] mt-1">Only your period entries are stored on this account.</p>
        </div>
        <button data-testid="period-logout" onClick={onLogout} className="btn-outline inline-flex items-center gap-2 self-start">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      {prediction && prediction.has_data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="card-soft bg-white p-4">
            <div className="text-xs text-[var(--yonii-muted)]">Next period</div>
            <div className="font-display text-xl mt-1">{new Date(prediction.next_period_start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
          </div>
          <div className="card-soft bg-white p-4">
            <div className="text-xs text-[var(--yonii-muted)]">Cycle</div>
            <div className="font-display text-xl mt-1">{prediction.avg_cycle_length} days</div>
          </div>
          <div className="card-soft bg-white p-4">
            <div className="text-xs text-[var(--yonii-muted)]">Ovulation</div>
            <div className="font-display text-xl mt-1">{new Date(prediction.predicted_ovulation).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
          </div>
          <div className="card-soft bg-white p-4">
            <div className="text-xs text-[var(--yonii-muted)]">Fertile window</div>
            <div className="font-display text-sm mt-1">
              {new Date(prediction.fertile_window_start).toLocaleDateString(undefined, { day: "numeric", month: "short" })} — {new Date(prediction.fertile_window_end).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MiniCalendar prediction={prediction} entries={entries} />
        </div>
        <div className="space-y-6">
          <form onSubmit={add} className="card-soft bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-[var(--yonii-primary)]">
              <Plus className="w-4 h-4" />
              <div className="text-xs uppercase tracking-widest">Log a period</div>
            </div>
            <div>
              <label className="text-sm">Start date</label>
              <input data-testid="period-start" type="date" required value={form.start_date}
                     onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                     className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-sm">End date (optional)</label>
              <input data-testid="period-end" type="date" value={form.end_date}
                     onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                     className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-sm">Flow (optional)</label>
              <select data-testid="period-flow" value={form.flow} onChange={(e) => setForm({ ...form, flow: e.target.value })}
                      className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">—</option>
                <option>Light</option>
                <option>Medium</option>
                <option>Heavy</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Notes (optional)</label>
              <input data-testid="period-notes" maxLength={300} value={form.notes}
                     onChange={(e) => setForm({ ...form, notes: e.target.value })}
                     className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
            <button data-testid="period-save" type="submit" className="btn-primary w-full">Save entry</button>
          </form>

          <div className="card-soft bg-white p-5">
            <div className="flex items-center gap-2 text-[var(--yonii-primary)] mb-3">
              <Sparkles className="w-4 h-4" />
              <div className="text-xs uppercase tracking-widest">History</div>
            </div>
            <ul className="divide-y divide-[var(--yonii-border)] text-sm max-h-72 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div>{new Date(e.start_date).toLocaleDateString()}{e.end_date && ` → ${new Date(e.end_date).toLocaleDateString()}`}</div>
                    <div className="text-xs text-[var(--yonii-muted)]">{e.flow || "—"}{e.notes ? ` · ${e.notes}` : ""}</div>
                  </div>
                  <button onClick={() => del(e.id)} aria-label="Delete entry" className="text-[var(--yonii-accent)]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {entries.length === 0 && <li className="py-4 text-[var(--yonii-muted)] text-sm">No entries yet — log your last period to see predictions.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Page shell ----------------------------------------------------------
export default function PeriodTracker() {
  const { token, email, login, logout } = useAuth();

  return (
    <div className="yonii-container py-14">
      <div className="max-w-4xl mx-auto">
        {!token && (
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3 text-[var(--yonii-primary)]">
              <CalendarDays className="w-4 h-4" />
              <div className="text-xs uppercase tracking-widest">Period Tracker</div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">Know your cycle.<br className="hidden md:block" /> Privately.</h1>
            <p className="mt-4 text-lg text-[var(--yonii-muted)] max-w-2xl mx-auto leading-relaxed">
              This is the only part of YONII that needs a login — because we need to remember your cycle for you. Everything else stays anonymous.
            </p>
          </div>
        )}

        {token
          ? <Dashboard token={token} email={email} onLogout={logout} />
          : <AuthPanel onAuthed={login} />}

        <div className="mt-10">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
}
