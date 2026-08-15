import React from "react";
import { http } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import { COMFORT_TIPS, SYMPTOM_TAGS } from "@/data/comfortTips";
import {
  CalendarDays, Droplet, LogOut, Plus, Trash2, Sparkles, ShieldCheck, Bell,
  LineChart as LineIcon, HeartHandshake, Settings, ChevronRight, X,
  Flame, Cloud, Battery, Moon, Brain, Heart as HeartIcon, Apple,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const TOKEN_KEY = "yonii_period_token";
const EMAIL_KEY = "yonii_period_email";

const ICON_MAP = { flame: Flame, cloud: Cloud, battery: Battery, moon: Moon, brain: Brain, heart: HeartIcon, apple: Apple, droplet: Droplet };

// ============ Auth hook ================================================
function useAuth() {
  const [token, setToken] = React.useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [email, setEmail] = React.useState(() => localStorage.getItem(EMAIL_KEY) || "");
  const login = React.useCallback((t, e) => {
    localStorage.setItem(TOKEN_KEY, t); localStorage.setItem(EMAIL_KEY, e); setToken(t); setEmail(e);
  }, []);
  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY); setToken(""); setEmail("");
  }, []);
  return { token, email, login, logout };
}

const withAuth = (t) => ({ headers: { Authorization: `Bearer ${t}` } });

// ============ Auth screen ===============================================
function AuthPanel({ onAuthed }) {
  const [mode, setMode] = React.useState("signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState(""); const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const path = mode === "signup" ? "/period/signup" : "/period/login";
      const { data } = await http.post(path, { email, password });
      onAuthed(data.token, data.email);
    } catch (e) { setErr(e?.response?.data?.detail || "Something went wrong."); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto card-soft bg-white p-8">
      <div className="flex items-center gap-2 mb-4">
        <Droplet className="w-4 h-4 text-[var(--yonii-accent)]" />
        <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Period Tracker</div>
      </div>
      <h2 className="font-display text-2xl mb-2">{mode === "signup" ? "Create your private account" : "Welcome back"}</h2>
      <p className="text-sm text-[var(--yonii-muted)] mb-4">
        An account is <span className="text-[var(--yonii-primary)] font-medium">only</span> used to save period entries, symptom logs and preferences. Everything else on YONII stays anonymous.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="text-sm font-medium">Email</label>
          <input data-testid="period-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 text-sm outline-none" /></div>
        <div><label className="text-sm font-medium">Password (min 6)</label>
          <input data-testid="period-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 text-sm outline-none" /></div>
        {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
        <button type="submit" disabled={busy} data-testid={mode === "signup" ? "period-signup-submit" : "period-login-submit"} className="btn-primary w-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
      <div className="mt-4 text-sm text-[var(--yonii-muted)]">
        {mode === "signup"
          ? <>Already have an account? <button data-testid="period-switch-login" className="link-underline text-[var(--yonii-primary)]" onClick={() => setMode("login")}>Log in</button></>
          : <>New here? <button data-testid="period-switch-signup" className="link-underline text-[var(--yonii-primary)]" onClick={() => setMode("signup")}>Create an account</button></>}
      </div>
      <div className="mt-6 flex items-start gap-2 text-xs text-[var(--yonii-muted)]">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-[var(--yonii-primary)]" />
        <span>Only your period + symptom logs are stored. Chats, image analyses and other YONII features remain fully anonymous.</span>
      </div>
    </div>
  );
}

// ============ Mini calendar =============================================
function MiniCalendar({ prediction, entries }) {
  const [month, setMonth] = React.useState(() => { const d = new Date(); d.setDate(1); return d; });
  const inRange = (d, s, e) => d >= s && d <= e;
  const periodRanges = entries.filter((e) => e.start_date).map((e) => ({ start: e.start_date, end: e.end_date || e.start_date }));

  const startWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0, 10);
    let tag = "";
    if (prediction?.has_data) {
      if (iso === prediction.next_period_start) tag = "next";
      else if (inRange(iso, prediction.fertile_window_start, prediction.fertile_window_end)) tag = "fertile";
      if (iso === prediction.predicted_ovulation) tag = "ovulation";
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
              c.tag === "next" ? { background: "#F4C7B8", color: "#3d1a10" } :
              c.tag === "ovulation" ? { background: "#2B4434", color: "white" } :
              c.tag === "fertile" ? { background: "rgba(43,68,52,0.15)", color: "#1a1c1a" } :
              { color: "#1a1c1a" }}>
            {c && c.d}
          </div>))}
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[var(--yonii-muted)]">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--yonii-accent)]" /> Logged period</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "#F4C7B8" }} /> Next period</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: "rgba(43,68,52,0.35)" }} /> Fertile window</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[var(--yonii-primary)]" /> Ovulation day</div>
      </div>
    </div>
  );
}

// ============ Reminder banner ============================================
function ReminderBanner({ prediction, settings }) {
  if (!prediction?.has_data || !settings?.browser_reminders) return null;
  const lead = settings.reminder_lead_days ?? 1;
  const dun = prediction.days_until_next;
  if (dun === undefined || dun < 0 || dun > lead) return null;

  const line = dun === 0
    ? "Your period is predicted to start today. Be gentle with yourself — heat pack, water, snacks nearby."
    : dun === 1
      ? "Heads up: your period is likely tomorrow. A good time to restock supplies and set a warm compress on standby."
      : `Your period is likely in about ${dun} days. Consider prepping supplies and easier meals for the week.`;

  return (
    <div className="card-soft bg-white p-4 mb-6 border-l-4 border-l-[var(--yonii-accent)] flex items-start gap-3">
      <Bell className="w-5 h-5 text-[var(--yonii-accent)] mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <div className="font-medium">Cycle reminder</div>
        <div className="text-[var(--yonii-muted)] mt-0.5">{line}</div>
      </div>
    </div>
  );
}

// ============ Cycle Overview tab ========================================
function CycleTab({ token, entries, prediction, reload, settings }) {
  const [form, setForm] = React.useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "", flow: "", notes: "",
  });
  const [err, setErr] = React.useState("");

  const add = async (e) => {
    e.preventDefault(); setErr("");
    try {
      await http.post("/period/entries", {
        start_date: form.start_date, end_date: form.end_date || null,
        flow: form.flow || null, notes: form.notes || null,
      }, withAuth(token));
      setForm({ start_date: new Date().toISOString().slice(0, 10), end_date: "", flow: "", notes: "" });
      reload();
    } catch (e) { setErr(e?.response?.data?.detail || "Could not save."); }
  };
  const del = async (id) => { await http.delete(`/period/entries/${id}`, withAuth(token)); reload(); };

  return (
    <>
      <ReminderBanner prediction={prediction} settings={settings} />

      {prediction?.has_data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
        </div>)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><MiniCalendar prediction={prediction} entries={entries} /></div>
        <div className="space-y-6">
          <form onSubmit={add} className="card-soft bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-[var(--yonii-primary)]">
              <Plus className="w-4 h-4" /><div className="text-xs uppercase tracking-widest">Log a period</div></div>
            <div><label className="text-sm">Start date</label>
              <input data-testid="period-start" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" /></div>
            <div><label className="text-sm">End date (optional)</label>
              <input data-testid="period-end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" /></div>
            <div><label className="text-sm">Flow (optional)</label>
              <select data-testid="period-flow" value={form.flow} onChange={(e) => setForm({ ...form, flow: e.target.value })}
                className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">—</option><option>Light</option><option>Medium</option><option>Heavy</option></select></div>
            <div><label className="text-sm">Notes</label>
              <input data-testid="period-notes" maxLength={300} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none" /></div>
            {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
            <button data-testid="period-save" type="submit" className="btn-primary w-full">Save entry</button>
          </form>

          <div className="card-soft bg-white p-5">
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">History</div>
            <ul className="divide-y divide-[var(--yonii-border)] text-sm max-h-72 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div>{new Date(e.start_date).toLocaleDateString()}{e.end_date && ` → ${new Date(e.end_date).toLocaleDateString()}`}</div>
                    <div className="text-xs text-[var(--yonii-muted)]">{e.flow || "—"}{e.notes ? ` · ${e.notes}` : ""}</div></div>
                  <button onClick={() => del(e.id)} aria-label="Delete" className="text-[var(--yonii-accent)]"><Trash2 className="w-4 h-4" /></button>
                </li>))}
              {entries.length === 0 && <li className="py-4 text-[var(--yonii-muted)] text-sm">No entries yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ Daily Log tab =============================================
function ScaleInput({ label, value, onChange, min = 0, max = 5, testid }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs text-[var(--yonii-muted)]">{value ?? "—"}</span>
      </div>
      <input data-testid={testid} type="range" min={min} max={max} step={1} value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--yonii-primary)]" />
    </div>
  );
}

function DailyLogTab({ token, logs, reload }) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = logs.find((l) => l.date === today) || {};
  const [state, setState] = React.useState({
    date: today,
    mood: existing.mood ?? 3,
    cramps: existing.cramps ?? 0,
    energy: existing.energy ?? 3,
    sleep_hours: existing.sleep_hours ?? 7,
    symptoms: existing.symptoms ?? [],
    notes: existing.notes ?? "",
  });
  const [ok, setOk] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    const e = logs.find((l) => l.date === state.date) || {};
    setState((s) => ({
      ...s,
      mood: e.mood ?? 3, cramps: e.cramps ?? 0, energy: e.energy ?? 3,
      sleep_hours: e.sleep_hours ?? 7, symptoms: e.symptoms ?? [], notes: e.notes ?? "",
    }));
  }, [state.date, logs]);

  const toggleTag = (t) => setState((s) => ({
    ...s, symptoms: s.symptoms.includes(t) ? s.symptoms.filter((x) => x !== t) : [...s.symptoms, t],
  }));

  const save = async (e) => {
    e.preventDefault(); setErr(""); setOk(false);
    try {
      await http.post("/period/logs", state, withAuth(token));
      setOk(true); reload();
      setTimeout(() => setOk(false), 2500);
    } catch (ex) { setErr(ex?.response?.data?.detail || "Could not save."); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={save} className="card-soft bg-white p-6 space-y-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--yonii-primary)]">
            <Sparkles className="w-4 h-4" />
            <div className="text-xs uppercase tracking-widest">Daily log</div>
          </div>
          <input data-testid="log-date" type="date" value={state.date}
            onChange={(e) => setState({ ...state, date: e.target.value })}
            className="bg-[var(--yonii-surface)] rounded-xl px-3 py-1.5 text-sm outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScaleInput testid="log-mood" label="Mood (1 low – 5 great)" value={state.mood} min={1} max={5} onChange={(v) => setState({ ...state, mood: v })} />
          <ScaleInput testid="log-cramps" label="Cramps (0 none – 5 severe)" value={state.cramps} min={0} max={5} onChange={(v) => setState({ ...state, cramps: v })} />
          <ScaleInput testid="log-energy" label="Energy (1 low – 5 great)" value={state.energy} min={1} max={5} onChange={(v) => setState({ ...state, energy: v })} />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Sleep (hours)</label>
              <span className="text-xs text-[var(--yonii-muted)]">{state.sleep_hours}h</span>
            </div>
            <input data-testid="log-sleep" type="range" min={0} max={12} step={0.5} value={state.sleep_hours}
              onChange={(e) => setState({ ...state, sleep_hours: Number(e.target.value) })}
              className="w-full accent-[var(--yonii-primary)]" />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Symptoms</div>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => toggleTag(t)}
                data-testid={`log-tag-${t.replace(/\s+/g, "-")}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  state.symptoms.includes(t)
                    ? "bg-[var(--yonii-primary)] text-white border-[var(--yonii-primary)]"
                    : "bg-white text-[var(--yonii-muted)] border-[var(--yonii-border)] hover:border-[var(--yonii-primary)]"}`}>
                {t}
              </button>))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <textarea data-testid="log-notes" value={state.notes} maxLength={300}
            onChange={(e) => setState({ ...state, notes: e.target.value })}
            className="mt-1 w-full bg-[var(--yonii-surface)] rounded-xl px-3 py-2 text-sm outline-none min-h-20"
            placeholder="Anything worth remembering — moods, cravings, workouts, medications…" />
        </div>

        {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
        {ok && <div className="text-sm text-[var(--yonii-primary)]">Saved ✓</div>}
        <button data-testid="log-save" type="submit" className="btn-primary w-full md:w-auto">Save daily log</button>
      </form>

      <div className="card-soft bg-white p-5">
        <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Recent logs</div>
        <ul className="divide-y divide-[var(--yonii-border)] text-sm max-h-[520px] overflow-y-auto">
          {logs.slice().reverse().slice(0, 30).map((l) => (
            <li key={l.id} className="py-2.5">
              <div className="flex items-center justify-between">
                <div className="font-medium">{new Date(l.date).toLocaleDateString()}</div>
                <div className="text-xs text-[var(--yonii-muted)]">M {l.mood ?? "—"} · C {l.cramps ?? "—"} · E {l.energy ?? "—"}</div>
              </div>
              {(l.symptoms || []).length > 0 && (
                <div className="text-xs text-[var(--yonii-muted)] mt-1">{(l.symptoms || []).join(" · ")}</div>)}
              {l.notes && <div className="text-xs text-[var(--yonii-muted)] italic mt-1">"{l.notes}"</div>}
            </li>))}
          {logs.length === 0 && <li className="py-4 text-[var(--yonii-muted)] text-sm">No daily logs yet.</li>}
        </ul>
      </div>
    </div>
  );
}

// ============ Insights tab (charts) =====================================
function InsightsTab({ prediction, logs }) {
  const cycleData = (prediction?.cycles_history || []).map((d, i) => ({ n: `#${i + 1}`, days: d }));

  const last90 = logs.slice(-90);
  const trend = last90.map((l) => ({
    date: new Date(l.date).toLocaleDateString(undefined, { day: "2-digit", month: "short" }),
    mood: l.mood, cramps: l.cramps, energy: l.energy,
  }));

  const symptomFreq = {};
  logs.forEach((l) => (l.symptoms || []).forEach((s) => { symptomFreq[s] = (symptomFreq[s] || 0) + 1; }));
  const symptomData = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const hasData = cycleData.length || trend.length || symptomData.length;
  if (!hasData) {
    return (
      <div className="card-soft bg-white p-10 text-center">
        <LineIcon className="w-6 h-6 mx-auto text-[var(--yonii-primary)] mb-3" />
        <div className="font-display text-lg">Charts appear as you log</div>
        <p className="text-sm text-[var(--yonii-muted)] mt-2">Log 2+ periods and a few daily entries to see patterns.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {cycleData.length > 0 && (
        <div className="card-soft bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Cycle length over time</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={cycleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e3df" />
                <XAxis dataKey="n" tick={{ fill: "#5c635a", fontSize: 12 }} />
                <YAxis tick={{ fill: "#5c635a", fontSize: 12 }} domain={[15, 45]} />
                <Tooltip contentStyle={{ background: "#fafaf8", border: "1px solid #e1e3df", borderRadius: 12 }} />
                <Bar dataKey="days" fill="#2B4434" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

      {trend.length > 0 && (
        <div className="card-soft bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Mood, cramps & energy (last 90 days)</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e3df" />
                <XAxis dataKey="date" tick={{ fill: "#5c635a", fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#5c635a", fontSize: 12 }} domain={[0, 5]} />
                <Tooltip contentStyle={{ background: "#fafaf8", border: "1px solid #e1e3df", borderRadius: 12 }} />
                <Line type="monotone" dataKey="mood" stroke="#2B4434" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cramps" stroke="#C15C3D" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="energy" stroke="#7c8b76" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--yonii-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2B4434]" /> Mood</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C15C3D]" /> Cramps</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7c8b76]" /> Energy</span>
          </div>
        </div>)}

      {symptomData.length > 0 && (
        <div className="card-soft bg-white p-5 lg:col-span-2">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Most frequent symptoms</div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={symptomData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e3df" />
                <XAxis type="number" tick={{ fill: "#5c635a", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#5c635a", fontSize: 12 }} width={110} />
                <Tooltip contentStyle={{ background: "#fafaf8", border: "1px solid #e1e3df", borderRadius: 12 }} />
                <Bar dataKey="count" fill="#C15C3D" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}
    </div>
  );
}

// ============ Comfort tab ================================================
function ComfortTab() {
  const [openId, setOpenId] = React.useState("cramps");
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 card-soft bg-white p-3 h-fit">
        <ul className="text-sm">
          {COMFORT_TIPS.map((t) => {
            const Icon = ICON_MAP[t.icon] || HeartIcon;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  data-testid={`comfort-tab-${t.id}`}
                  onClick={() => setOpenId(t.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                    openId === t.id ? "bg-[var(--yonii-surface)] text-[var(--yonii-text)]"
                                    : "text-[var(--yonii-muted)] hover:text-[var(--yonii-text)] hover:bg-[var(--yonii-surface)]"}`}>
                  <span className="flex items-center gap-2"><Icon className="w-4 h-4 text-[var(--yonii-primary)]" /> {t.title}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </li>);
          })}
        </ul>
      </div>
      <div className="md:col-span-2 space-y-4">
        {COMFORT_TIPS.filter((t) => t.id === openId).map((t) => (
          <div key={t.id} data-testid={`comfort-panel-${t.id}`} className="card-soft bg-white p-6">
            <h2 className="font-display text-2xl text-[var(--yonii-primary)] mb-1">{t.title}</h2>
            <p className="text-sm text-[var(--yonii-muted)] mb-5">{t.intro}</p>
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-2">Try</div>
            <ul className="space-y-1.5 text-sm mb-5 list-disc pl-5">{t.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-2">What to avoid</div>
            <ul className="space-y-1.5 text-sm mb-5 list-disc pl-5">{t.avoid.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-accent)] mb-2">When to see a doctor</div>
            <p className="text-sm">{t.seeDoctor}</p>
          </div>))}
      </div>
    </div>
  );
}

// ============ Settings tab ==============================================
function SettingsTab({ token, settings, reloadSettings }) {
  const [lead, setLead] = React.useState(settings?.reminder_lead_days ?? 1);
  const [browser, setBrowser] = React.useState(settings?.browser_reminders ?? true);
  const [permission, setPermission] = React.useState(typeof Notification !== "undefined" ? Notification.permission : "denied");
  const [ok, setOk] = React.useState(false);

  const enablePush = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      new Notification("YONII reminders enabled", { body: "We'll nudge you a day before your period.", icon: "/yonii-icon-192.png" });
    }
  };

  const save = async (e) => {
    e.preventDefault(); setOk(false);
    await http.put("/period/settings", { reminder_lead_days: lead, browser_reminders: browser }, withAuth(token));
    await reloadSettings();
    setOk(true); setTimeout(() => setOk(false), 2500);
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={save} className="card-soft bg-white p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1"><Bell className="w-4 h-4 text-[var(--yonii-primary)]" />
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Cycle reminders</div></div>
          <p className="text-sm text-[var(--yonii-muted)]">Choose how many days before your predicted period YONII should nudge you.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <button key={n} type="button" data-testid={`settings-lead-${n}`} onClick={() => setLead(n)}
              className={`px-4 py-3 rounded-xl border text-sm transition ${
                lead === n ? "bg-[var(--yonii-primary)] text-white border-[var(--yonii-primary)]"
                          : "bg-white text-[var(--yonii-text)] border-[var(--yonii-border)] hover:border-[var(--yonii-primary)]"}`}>
              {n} day{n > 1 ? "s" : ""} before
            </button>))}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={browser} onChange={(e) => setBrowser(e.target.checked)}
            data-testid="settings-browser-toggle" className="w-5 h-5 accent-[var(--yonii-primary)]" />
          <span className="text-sm">Show in-app reminder banner on the tracker</span>
        </label>

        <div className="border-t border-[var(--yonii-border)] pt-5">
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-2">Browser notifications</div>
          <p className="text-sm text-[var(--yonii-muted)] mb-3">
            Status: <span className="font-medium text-[var(--yonii-primary)]">{permission}</span>. When granted, YONII sends a native reminder if this tab is open on the reminder day.
          </p>
          {permission !== "granted" && (
            <button type="button" data-testid="settings-enable-push" onClick={enablePush} className="btn-outline text-sm">
              Enable browser notifications
            </button>)}
        </div>

        {ok && <div className="text-sm text-[var(--yonii-primary)]">Settings saved ✓</div>}
        <button data-testid="settings-save" type="submit" className="btn-primary">Save settings</button>
      </form>
    </div>
  );
}

// ============ Dashboard shell (tabs) ====================================
function Dashboard({ token, email, onLogout }) {
  const [entries, setEntries] = React.useState([]);
  const [prediction, setPrediction] = React.useState(null);
  const [logs, setLogs] = React.useState([]);
  const [settings, setSettings] = React.useState({ reminder_lead_days: 1, browser_reminders: true });
  const [tab, setTab] = React.useState("cycle");

  const reload = React.useCallback(async () => {
    try {
      const [e, p, l] = await Promise.all([
        http.get("/period/entries", withAuth(token)),
        http.get("/period/prediction", withAuth(token)),
        http.get("/period/logs", withAuth(token)),
      ]);
      setEntries(e.data.entries || []); setPrediction(p.data); setLogs(l.data.logs || []);
    } catch (ex) { if (ex?.response?.status === 401) onLogout(); }
  }, [token, onLogout]);

  const reloadSettings = React.useCallback(async () => {
    try { const { data } = await http.get("/period/settings", withAuth(token)); setSettings(data); }
    catch {}
  }, [token]);

  React.useEffect(() => { reload(); reloadSettings(); }, [reload, reloadSettings]);

  // Fire browser notification if today matches lead window and tab is open
  React.useEffect(() => {
    if (!prediction?.has_data || !settings?.browser_reminders) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const dun = prediction.days_until_next;
    if (dun === undefined || dun < 0 || dun > (settings.reminder_lead_days ?? 1)) return;
    const key = `yonii_notified_${prediction.next_period_start}_${dun}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    try {
      new Notification("YONII cycle reminder", {
        body: dun === 0 ? "Your period is likely today. Be kind to yourself." : `Your period is likely in ${dun} day${dun > 1 ? "s" : ""}.`,
        icon: "/yonii-icon-192.png",
      });
    } catch {}
  }, [prediction, settings]);

  const TABS = [
    { id: "cycle",   label: "Cycle",     icon: CalendarDays,   tid: "period-tab-cycle" },
    { id: "log",     label: "Daily Log", icon: Sparkles,       tid: "period-tab-log" },
    { id: "insights",label: "Insights",  icon: LineIcon,       tid: "period-tab-insights" },
    { id: "comfort", label: "Comfort",   icon: HeartHandshake, tid: "period-tab-comfort" },
    { id: "settings",label: "Settings",  icon: Settings,       tid: "period-tab-settings" },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Signed in</div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight">{email}</h1>
        </div>
        <button data-testid="period-logout" onClick={onLogout} className="btn-outline inline-flex items-center gap-2 self-start">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-6 -mx-2 px-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} data-testid={t.tid} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                tab === t.id ? "bg-[var(--yonii-primary)] text-white"
                             : "bg-white border border-[var(--yonii-border)] text-[var(--yonii-muted)] hover:text-[var(--yonii-text)]"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>);
        })}
      </div>

      {tab === "cycle"    && <CycleTab   token={token} entries={entries} prediction={prediction} reload={reload} settings={settings} />}
      {tab === "log"      && <DailyLogTab token={token} logs={logs} reload={reload} />}
      {tab === "insights" && <InsightsTab prediction={prediction} logs={logs} />}
      {tab === "comfort"  && <ComfortTab />}
      {tab === "settings" && <SettingsTab token={token} settings={settings} reloadSettings={reloadSettings} />}
    </>
  );
}

// ============ Page shell =================================================
export default function PeriodTracker() {
  const { token, email, login, logout } = useAuth();
  return (
    <div className="yonii-container py-14">
      <div className="max-w-6xl mx-auto">
        {!token && (
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3 text-[var(--yonii-primary)]">
              <CalendarDays className="w-4 h-4" />
              <div className="text-xs uppercase tracking-widest">Period Tracker</div>
            </div>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">Know your cycle.<br className="hidden md:block" /> Privately.</h1>
            <p className="mt-4 text-lg text-[var(--yonii-muted)] max-w-2xl mx-auto leading-relaxed">
              Log periods, track daily symptoms, spot patterns, get gentle reminders and find real comfort tips — all in one calm private space.
            </p>
          </div>)}

        {token ? <Dashboard token={token} email={email} onLogout={logout} /> : <AuthPanel onAuthed={login} />}

        <div className="mt-10"><Disclaimer /></div>
      </div>
    </div>
  );
}
