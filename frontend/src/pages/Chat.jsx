import React from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { http } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import AIMessage from "@/components/AIMessage";
import { TID } from "@/constants/testIds";
import { EXAMPLE_PROMPTS } from "@/data/hubs";

export default function ChatPage() {
  const loc = useLocation();
  const initialQ = React.useMemo(() => new URLSearchParams(loc.search).get("q") || "", [loc.search]);

  const [messages, setMessages] = React.useState([]);
  const [sessionId, setSessionId] = React.useState(null);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollerRef = React.useRef(null);
  const sentOnceRef = React.useRef(false);

  const send = React.useCallback(async (text) => {
    const message = (text ?? "").trim();
    if (!message || busy) return;
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    try {
      const { data } = await http.post("/chat", { message, session_id: sessionId });
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      const detail = err?.response?.data?.detail || "YONII is temporarily unavailable. Please try again later.";
      setMessages((prev) => [...prev, { role: "assistant", content: detail, error: true }]);
    } finally {
      setBusy(false);
    }
  }, [busy, sessionId]);

  React.useEffect(() => {
    if (initialQ && !sentOnceRef.current) {
      sentOnceRef.current = true;
      send(initialQ);
    }
  }, [initialQ, send]);

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  return (
    <div className="yonii-container py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--yonii-primary)]" />
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Anonymous chat</div>
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-3">Ask YONII</h1>
        <p className="text-[var(--yonii-muted)] mb-6">Private, judgment-free sexual-health information. No account required.</p>

        <div data-testid={TID.chat.disclaimer}>
          <Disclaimer compact />
        </div>

        <div
          ref={scrollerRef}
          className="mt-6 card-soft bg-white p-4 md:p-6 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="text-sm text-[var(--yonii-muted)]">
              <div className="mb-3">Try one of these to get started:</div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.slice(0, 5).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => send(p)}
                    className="text-sm px-3 py-1.5 rounded-full border border-[var(--yonii-border)] hover:border-[var(--yonii-primary)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} data-testid={TID.chat.message(i)} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <div className="max-w-[85%] bg-[var(--yonii-primary)] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[95%]">
                  <div className={`text-sm ${m.error ? "text-[var(--yonii-accent)]" : ""}`}>
                    <AIMessage text={m.content} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="text-sm text-[var(--yonii-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--yonii-primary)] animate-pulse" />
              YONII is thinking…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mt-4 flex items-center gap-2 bg-white border border-[var(--yonii-border)] rounded-full p-2"
        >
          <input
            data-testid={TID.chat.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a sexual-health question…"
            className="flex-1 bg-transparent px-4 py-2 outline-none text-base placeholder:text-[var(--yonii-muted)]"
            aria-label="Ask YONII"
          />
          <button
            type="submit"
            data-testid={TID.chat.send}
            disabled={busy || !input.trim()}
            className="btn-primary flex items-center gap-2"
          >
            Send <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
