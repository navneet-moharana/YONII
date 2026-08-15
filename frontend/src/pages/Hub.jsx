import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HUBS } from "@/data/hubs";
import Disclaimer from "@/components/Disclaimer";

export default function Hub() {
  const { slug } = useParams();
  const hub = HUBS[slug];
  if (!hub) return <Navigate to="/" replace />;

  return (
    <div className="yonii-container py-12">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Learn</div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">{hub.title}</h1>
        <p className="mt-4 text-lg text-[var(--yonii-muted)] leading-relaxed">{hub.intro}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {hub.topics.map((t, i) => (
          <article key={i} className="card-soft p-6 bg-white">
            <h3 className="font-display text-xl text-[var(--yonii-primary)] mb-2">{t.title}</h3>
            <p className="text-sm leading-relaxed text-[var(--yonii-text)]">{t.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 card-soft p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg">Have a specific question?</div>
          <div className="text-sm text-[var(--yonii-muted)]">Ask YONII privately — no account needed.</div>
        </div>
        <Link to="/chat" className="btn-primary inline-flex items-center gap-2">
          Ask YONII <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
