import React from "react";
import { http } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import AIMessage from "@/components/AIMessage";
import { TID } from "@/constants/testIds";
import { Stethoscope } from "lucide-react";

export default function SymptomChecker() {
  const [form, setForm] = React.useState({
    symptom: "",
    body_area: "",
    duration: "",
    severity: "",
    associated: "",
    context: "",
  });
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [error, setError] = React.useState("");

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.symptom.trim() || busy) return;
    setBusy(true); setResult(""); setError("");
    try {
      const { data } = await http.post("/symptom-check", form);
      setResult(data.answer);
    } catch (err) {
      setError(err?.response?.data?.detail || "YONII is temporarily unavailable. Please try again later.");
    } finally { setBusy(false); }
  };

  return (
    <div className="yonii-container py-12">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-4 h-4 text-[var(--yonii-primary)]" />
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Symptom checker</div>
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">A careful look at what you're noticing</h1>
        <p className="mt-4 text-[var(--yonii-muted)] leading-relaxed">
          Answer as much as you're comfortable with. YONII will explain possibilities, precautions and when to see a doctor. It never gives a diagnosis.
        </p>

        <form onSubmit={submit} className="mt-8 card-soft bg-white p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">What symptom are you noticing? *</label>
            <textarea
              data-testid={TID.symptom.symptom}
              value={form.symptom}
              onChange={upd("symptom")}
              required
              className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-3 outline-none text-sm min-h-24"
              placeholder="e.g. small red bumps on the skin, itching, mild burning while urinating…"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Body area</label>
              <input data-testid={TID.symptom.area} value={form.body_area} onChange={upd("body_area")}
                     className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm"
                     placeholder="e.g. genital area, lower abdomen" />
            </div>
            <div>
              <label className="text-sm font-medium">Duration</label>
              <input data-testid={TID.symptom.duration} value={form.duration} onChange={upd("duration")}
                     className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm"
                     placeholder="e.g. 3 days, 2 weeks" />
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select data-testid={TID.symptom.severity} value={form.severity} onChange={upd("severity")}
                      className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm">
                <option value="">Choose…</option>
                <option>Mild</option>
                <option>Moderate</option>
                <option>Severe</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Associated symptoms</label>
              <input data-testid={TID.symptom.associated} value={form.associated} onChange={upd("associated")}
                     className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm"
                     placeholder="e.g. fever, discharge, pain" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Anything else useful?</label>
            <textarea data-testid={TID.symptom.context} value={form.context} onChange={upd("context")}
                      className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-3 outline-none text-sm min-h-20"
                      placeholder="Recent activities, medications, other context (avoid personal identifying info)…" />
          </div>
          <button
            type="submit"
            data-testid={TID.symptom.submit}
            disabled={busy || !form.symptom.trim()}
            className="btn-primary w-full md:w-auto"
          >
            {busy ? "Analyzing…" : "Get educational guidance"}
          </button>
        </form>

        {error && <div className="mt-6 text-sm text-[var(--yonii-accent)]">{error}</div>}

        {result && (
          <div data-testid={TID.symptom.result} className="mt-6 card-soft bg-white p-6">
            <AIMessage text={result} />
          </div>
        )}

        <div className="mt-10"><Disclaimer /></div>
      </div>
    </div>
  );
}
