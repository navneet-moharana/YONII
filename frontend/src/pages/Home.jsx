import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Lock, Sparkles, MessageCircle, Stethoscope, Camera } from "lucide-react";
import { EXAMPLE_PROMPTS, HUB_LIST } from "@/data/hubs";
import { TID } from "@/constants/testIds";
import Disclaimer from "@/components/Disclaimer";

const HERO_IMG =
  "https://images.unsplash.com/photo-1714636608872-048fc9231892?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

export default function Home() {
  const [q, setQ] = React.useState("");
  const nav = useNavigate();

  const submit = (text) => {
    const value = (text ?? q).trim();
    if (!value) return;
    nav(`/chat?q=${encodeURIComponent(value)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative yonii-container pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--yonii-border)] text-xs text-[var(--yonii-muted)] mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--yonii-primary)]" />
            No sign-up · No email · No judgment
          </div>
          <h1
            data-testid={TID.home.heroTitle}
            className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl"
          >
            Ask anything about <span className="text-[var(--yonii-primary)]">sexual health.</span>
          </h1>
          <p className="mt-5 text-lg text-[var(--yonii-muted)] max-w-2xl leading-relaxed">
            Private, judgment-free sexual-health information for adults. YONII listens, explains, and helps you decide when it's time to see a doctor.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="mt-10 max-w-2xl bg-white border border-[var(--yonii-border)] rounded-3xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] flex items-center gap-2"
          >
            <input
              data-testid={TID.home.chatInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent px-4 py-3 outline-none text-base placeholder:text-[var(--yonii-muted)]"
              aria-label="Ask YONII"
            />
            <button
              type="submit"
              data-testid={TID.home.chatSend}
              className="btn-primary flex items-center gap-2"
              disabled={!q.trim()}
            >
              Ask <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 max-w-3xl">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => submit(p)}
                data-testid={TID.home.examplePrompt(i)}
                className="text-sm px-3 py-1.5 rounded-full bg-white border border-[var(--yonii-border)] text-[var(--yonii-muted)] hover:text-[var(--yonii-text)] hover:border-[var(--yonii-primary)] transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Explore hubs */}
      <section className="yonii-container mt-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-2">Explore</div>
            <h2 className="font-display text-2xl sm:text-3xl tracking-tight">Understand your body, on your own terms</h2>
          </div>
          <Link to="/symptom-checker" className="hidden md:inline-flex items-center gap-1 text-sm text-[var(--yonii-primary)] link-underline">
            Symptom checker <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {HUB_LIST.map((h) => (
            <Link
              key={h.slug}
              to={`/hub/${h.slug}`}
              data-testid={TID.home.hub(h.slug)}
              className="card-soft p-6 hover:border-[var(--yonii-primary)] transition group"
            >
              <div className="flex items-center gap-2 mb-3 text-[var(--yonii-primary)]">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Hub</span>
              </div>
              <div className="font-display text-xl mb-2 group-hover:text-[var(--yonii-primary)] transition">
                {h.title}
              </div>
              <p className="text-sm text-[var(--yonii-muted)] leading-relaxed">{h.intro}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--yonii-primary)]">
                Read <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Three services strip */}
      <section className="yonii-container mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/chat" className="card-soft p-6 hover:border-[var(--yonii-primary)] transition">
          <MessageCircle className="w-5 h-5 text-[var(--yonii-primary)]" />
          <div className="mt-3 font-display text-lg">Anonymous AI Chat</div>
          <div className="text-sm text-[var(--yonii-muted)] mt-1">Ask anything — private, non-judgmental.</div>
        </Link>
        <Link to="/symptom-checker" className="card-soft p-6 hover:border-[var(--yonii-primary)] transition">
          <Stethoscope className="w-5 h-5 text-[var(--yonii-primary)]" />
          <div className="mt-3 font-display text-lg">Symptom Checker</div>
          <div className="text-sm text-[var(--yonii-muted)] mt-1">Guided questions, careful, uncertainty-aware answers.</div>
        </Link>
        <Link to="/image-check" data-testid={TID.home.imageCheckCta} className="card-soft p-6 hover:border-[var(--yonii-accent)] transition bg-white">
          <Camera className="w-5 h-5 text-[var(--yonii-accent)]" />
          <div className="mt-3 font-display text-lg">Image Health Check</div>
          <div className="text-sm text-[var(--yonii-muted)] mt-1">Skin concerns, intimate-area photos or lab reports — get AI-guided educational feedback.</div>
          <div className="mt-3 inline-flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-full bg-[var(--yonii-accent)] text-white text-xs font-medium">₹9</span>
            <span className="text-[var(--yonii-muted)]">per image · no subscription</span>
          </div>
        </Link>
      </section>

      {/* Privacy promise */}
      <section className="yonii-container mt-16">
        <div className="card-soft p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center bg-white">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-primary)] mb-2 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Privacy first
            </div>
            <h2 className="font-display text-3xl leading-tight mb-4">
              Ask privately. <br className="hidden md:block" /> No account required.
            </h2>
            <ul className="space-y-2 text-sm text-[var(--yonii-muted)]">
              <li>· No name, email or phone number</li>
              <li>· No profile, no password</li>
              <li>· No permanent storage of intimate images</li>
              <li>· Every uploaded image is discarded after analysis</li>
            </ul>
          </div>
          <div className="font-editorial italic text-2xl leading-snug text-[var(--yonii-primary)]">
            "You deserve accurate answers about your body — without shame, judgment, or surveillance."
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="yonii-container mt-10 mb-4">
        <Disclaimer />
      </section>
    </div>
  );
}
