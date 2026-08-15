import React from "react";
import { useParams } from "react-router-dom";
import { http } from "@/lib/api";
import { CalendarDays, ShieldCheck, HeartPulse, ExternalLink } from "lucide-react";

export default function SharedCycle() {
  const { shareId } = useParams();
  const [data, setData] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get(`/period/share/${shareId}`);
        setData(data);
      } catch (e) {
        setErr(e?.response?.data?.detail || "This link is not valid.");
      }
    })();
  }, [shareId]);

  return (
    <div className="min-h-screen">
      <header className="glass-nav">
        <div className="yonii-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-[var(--yonii-primary)] flex items-center justify-center overflow-hidden">
              <img src="/yonii-logo.png" alt="YONII" className="w-6 h-6 object-contain" />
            </span>
            <span className="font-display font-semibold text-lg tracking-tight">YONII</span>
          </div>
          <a href="/" className="text-xs text-[var(--yonii-muted)] inline-flex items-center gap-1 link-underline">
            About YONII <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      <main className="yonii-container py-14">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[var(--yonii-primary)]">
            <CalendarDays className="w-4 h-4" />
            <div className="text-xs uppercase tracking-widest">Shared cycle preview</div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">
            A private cycle heads-up
          </h1>
          <p className="mt-4 text-lg text-[var(--yonii-muted)] leading-relaxed">
            Someone shared their next-period and fertile-window predictions with you via YONII. Personal notes, symptoms and daily logs stay private with them.
          </p>

          {err && <div data-testid="shared-error" className="mt-8 card-soft bg-white p-6 text-[var(--yonii-accent)] text-sm">{err}</div>}

          {data && !err && (
            data.has_data ? (
              <div data-testid="shared-content" className="mt-10 space-y-4">
                <div className="card-soft bg-white p-6">
                  <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Next period likely</div>
                  <div className="font-display text-4xl mt-2 text-[var(--yonii-accent)]">
                    {new Date(data.next_period_start).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                  </div>
                  <div className="text-sm text-[var(--yonii-muted)] mt-1">
                    {data.days_until_next >= 0
                      ? `in about ${data.days_until_next} day${data.days_until_next === 1 ? "" : "s"}`
                      : "recently — check with them"}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card-soft bg-white p-5">
                    <div className="text-xs text-[var(--yonii-muted)]">Fertile window</div>
                    <div className="font-display text-lg mt-1">
                      {new Date(data.fertile_window_start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      {" — "}
                      {new Date(data.fertile_window_end).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="card-soft bg-white p-5">
                    <div className="text-xs text-[var(--yonii-muted)]">Ovulation day</div>
                    <div className="font-display text-lg mt-1">
                      {new Date(data.predicted_ovulation).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="card-soft bg-white p-5 md:col-span-2">
                    <div className="text-xs text-[var(--yonii-muted)]">Average cycle</div>
                    <div className="font-display text-lg mt-1">{data.avg_cycle_length} days</div>
                  </div>
                </div>
                <div className="card-soft bg-white p-5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[var(--yonii-primary)] mt-0.5" />
                  <p className="text-sm text-[var(--yonii-muted)]">{data.note}</p>
                </div>
              </div>
            ) : (
              <div data-testid="shared-empty" className="mt-8 card-soft bg-white p-6 text-sm text-[var(--yonii-muted)]">
                {data.message}
              </div>
            )
          )}

          <div className="mt-12 text-center">
            <a href="/" className="btn-outline inline-flex items-center gap-2">
              <HeartPulse className="w-4 h-4" /> Explore YONII
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
