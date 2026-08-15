import React from "react";
import { TID } from "@/constants/testIds";

const KEY = "yonii_age_confirmed_v1";

export default function AgeGate({ children }) {
  const [confirmed, setConfirmed] = React.useState(() => {
    try { return localStorage.getItem(KEY) === "yes"; } catch { return false; }
  });
  const [rejected, setRejected] = React.useState(false);

  if (confirmed) return children;

  const confirm = () => {
    try { localStorage.setItem(KEY, "yes"); } catch {}
    setConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ background: "var(--yonii-bg)" }}
         data-testid={TID.ageGate.dialog}
         role="dialog"
         aria-modal="true">
      <div className="absolute inset-0 pointer-events-none opacity-40"
           style={{ background: "radial-gradient(600px 300px at 20% 20%, rgba(43,68,52,0.12), transparent 60%), radial-gradient(500px 300px at 80% 80%, rgba(193,92,61,0.10), transparent 60%)" }} />
      <div className="relative max-w-lg w-full bg-white rounded-3xl border border-[var(--yonii-border)] p-8 md:p-10 fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[var(--yonii-primary)] flex items-center justify-center text-white font-display font-semibold">Y</div>
          <div className="font-display text-xl tracking-tight">YONII</div>
        </div>
        <h1 className="font-display text-3xl md:text-4xl leading-tight tracking-tight mb-3">
          Your private sexual-health companion.
        </h1>
        <p className="text-sm text-[var(--yonii-muted)] mb-6 leading-relaxed">
          This platform provides sexual-health and sexual-wellness information intended for adults aged 18 and above.
        </p>
        <div className="card-soft p-5 mb-6">
          <div className="text-base font-medium text-[var(--yonii-text)]">Are you 18 years or older?</div>
          <div className="text-xs text-[var(--yonii-muted)] mt-2">Self-attestation only. YONII does not collect ID, name, email or phone.</div>
        </div>
        {rejected ? (
          <div>
            <div className="text-sm text-[var(--yonii-accent)] leading-relaxed mb-4">
              YONII is intended for adults aged 18 and above.
            </div>
            <button
              type="button"
              onClick={() => setRejected(false)}
              data-testid="age-gate-back-button"
              className="btn-outline w-full"
            >
              Go back
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={confirm} data-testid={TID.ageGate.confirm} className="btn-primary w-full sm:flex-1">
              Yes, I'm 18+
            </button>
            <button type="button" onClick={() => setRejected(true)} data-testid={TID.ageGate.reject} className="btn-outline w-full sm:flex-1">
              I'm under 18
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
