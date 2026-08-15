import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

// A calm 4-2-6 breathwork loop with a breathing circle animation.
// No external audio — pure visual + optional gentle tone via WebAudio.

const PATTERN = [
  { label: "Breathe in",  seconds: 4, scale: 1.0 },
  { label: "Hold",         seconds: 2, scale: 1.0 },
  { label: "Breathe out",  seconds: 6, scale: 0.5 },
];

function useAudio() {
  const ctxRef = React.useRef(null);
  const play = React.useCallback((freq, duration = 0.15) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + duration + 0.02);
    } catch {}
  }, []);
  return play;
}

export default function BreathworkPlayer() {
  const [running, setRunning] = React.useState(false);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [remaining, setRemaining] = React.useState(PATTERN[0].seconds);
  const [cycles, setCycles] = React.useState(0);
  const [sound, setSound] = React.useState(true);
  const audio = useAudio();
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        setStepIdx((i) => {
          const next = (i + 1) % PATTERN.length;
          if (next === 0) setCycles((c) => c + 1);
          if (sound) audio(next === 0 ? 440 : next === 1 ? 523 : 349);
          setRemaining(PATTERN[next].seconds);
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, sound, audio]);

  const start = () => {
    if (sound) audio(440);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false); setStepIdx(0); setRemaining(PATTERN[0].seconds); setCycles(0);
  };

  const step = PATTERN[stepIdx];
  const scale = running
    ? step.label === "Breathe in" ? 1.0 : step.label === "Hold" ? 1.0 : 0.5
    : 0.7;

  return (
    <div data-testid="breathwork-player" className="card-soft bg-white p-6">
      <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-1">Breathwork</div>
      <h3 className="font-display text-xl text-[var(--yonii-primary)] mb-1">4 · 2 · 6 calming breath</h3>
      <p className="text-sm text-[var(--yonii-muted)] mb-6">
        Follow the circle. Longer exhale signals your nervous system to relax — helpful for cramps, PMS anxiety and poor sleep.
      </p>

      <div className="flex flex-col items-center py-4">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div
            aria-hidden
            className="absolute rounded-full transition-transform ease-in-out"
            style={{
              width: 180, height: 180,
              background: "radial-gradient(circle at 30% 30%, rgba(43,68,52,0.9), rgba(43,68,52,0.4))",
              transform: `scale(${scale})`,
              transitionDuration: `${running ? step.seconds : 0.8}s`,
            }}
          />
          <div className="relative z-10 text-center text-white">
            <div className="font-display text-xl">{step.label}</div>
            <div className="text-4xl font-display tabular-nums mt-1">{remaining}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          {running ? (
            <button data-testid="breathwork-pause" onClick={pause} className="btn-primary inline-flex items-center gap-2">
              <Pause className="w-4 h-4" /> Pause
            </button>
          ) : (
            <button data-testid="breathwork-start" onClick={start} className="btn-primary inline-flex items-center gap-2">
              <Play className="w-4 h-4" /> Start
            </button>
          )}
          <button data-testid="breathwork-reset" onClick={reset} className="btn-outline inline-flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <label className="text-xs text-[var(--yonii-muted)] inline-flex items-center gap-1.5 cursor-pointer ml-2">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)}
                   className="w-4 h-4 accent-[var(--yonii-primary)]" />
            Sound
          </label>
        </div>
        <div className="mt-4 text-xs text-[var(--yonii-muted)]">
          {cycles} full breath{cycles === 1 ? "" : "s"} · Try 5 rounds to feel a shift
        </div>
      </div>
    </div>
  );
}
