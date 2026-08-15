import React from "react";
import { http } from "@/lib/api";
import Disclaimer from "@/components/Disclaimer";
import AIMessage from "@/components/AIMessage";
import { TID } from "@/constants/testIds";
import { Camera, Lock, Trash2, ShieldCheck, ImagePlus, CheckCircle2 } from "lucide-react";

const BG =
  "https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

async function loadRazorpayScript() {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function ImageCheck() {
  const [file, setFile] = React.useState(null);
  const [preview, setPreview] = React.useState("");
  const [note, setNote] = React.useState("");
  const [step, setStep] = React.useState("upload"); // upload | pay | processing | result
  const [order, setOrder] = React.useState(null);
  const [result, setResult] = React.useState("");
  const [analysisId, setAnalysisId] = React.useState("");
  const [error, setError] = React.useState("");

  const onFile = (f) => {
    setError("");
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Please upload a JPEG, PNG or WEBP image.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const startPayment = async () => {
    if (!file) return;
    setError("");
    try {
      const { data } = await http.post("/payments/order");
      setOrder(data);
      setStep("pay");

      if (data.mock) {
        // Mock verify directly
        await verify({
          razorpay_order_id: data.order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok) {
        setError("Could not load payment gateway. Please try again.");
        setStep("upload");
        return;
      }
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "YONII",
        description: "Image Health Check (single analysis)",
        order_id: data.order_id,
        theme: { color: "#2B4434" },
        handler: (resp) => verify(resp),
        modal: { ondismiss: () => setStep("upload") },
      });
      rzp.open();
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not create payment. Please try again.");
      setStep("upload");
    }
  };

  const verify = async (resp) => {
    try {
      setStep("processing");
      await http.post("/payments/verify", resp);
      const fd = new FormData();
      fd.append("order_id", resp.razorpay_order_id);
      fd.append("note", note);
      fd.append("file", file);
      const { data } = await http.post("/image-check", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data.result);
      setAnalysisId(data.analysis_id);
      setStep("result");
      // Free the local preview object URL
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
      setFile(null);
    } catch (e) {
      setError(e?.response?.data?.detail || "We couldn't analyze this image. Please try again.");
      setStep("upload");
    }
  };

  const deleteAnalysis = async () => {
    if (!analysisId) return;
    try {
      await http.delete(`/image-check/${analysisId}`);
      setResult("");
      setAnalysisId("");
      setStep("upload");
    } catch {}
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 opacity-30 pointer-events-none max-h-[520px] overflow-hidden">
        <img src={BG} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative yonii-container py-14">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-4 h-4 text-[var(--yonii-accent)]" />
            <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)]">Image Health Check</div>
          </div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05]">
            Something looks different?
          </h1>
          <p className="mt-4 text-lg text-[var(--yonii-muted)] leading-relaxed">
            Upload a photo of any concern — a rash, bump or discolouration on your intimate or surrounding areas, a general skin problem, or even a photo of a lab report or prescription you'd like translated into plain English. YONII gives educational guidance, not a diagnosis. Your image is processed in memory and discarded.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--yonii-border)]">
              <Lock className="w-3.5 h-3.5" /> Zero image retention
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--yonii-border)]">
              <ShieldCheck className="w-3.5 h-3.5" /> EXIF stripped automatically
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[var(--yonii-border)]">
              No account · No history
            </span>
          </div>

          {/* Upload area */}
          {step === "upload" && (
            <div className="mt-8 card-soft bg-white p-6">
              <label
                data-testid={TID.imageCheck.fileDrop}
                htmlFor="yonii-image-input"
                className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[var(--yonii-border)] rounded-2xl p-10 hover:border-[var(--yonii-primary)] transition text-center"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="max-h-64 rounded-xl" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-[var(--yonii-primary)] mb-2" />
                    <div className="text-sm font-medium">Tap to select an image</div>
                    <div className="text-xs text-[var(--yonii-muted)] mt-1">Skin concern · intimate area · lab report · prescription · medication</div>
                    <div className="text-[11px] text-[var(--yonii-muted)] mt-1">JPEG, PNG or WEBP · under 8 MB</div>
                  </>
                )}
                <input
                  id="yonii-image-input"
                  data-testid={TID.imageCheck.fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>

              <div className="mt-5">
                <label className="text-sm font-medium">Optional note (context, not personal info)</label>
                <textarea
                  data-testid={TID.imageCheck.note}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-3 outline-none text-sm min-h-20"
                  placeholder="e.g. 'appeared 3 days ago, mildly itchy'"
                  maxLength={500}
                />
              </div>

              {error && <div className="mt-4 text-sm text-[var(--yonii-accent)]">{error}</div>}

              <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-5 border-t border-[var(--yonii-border)]">
                <div>
                  <div className="font-display text-xl">₹9 <span className="text-sm font-medium text-[var(--yonii-muted)]">/ image</span></div>
                  <div className="text-xs text-[var(--yonii-muted)]">One-time. No subscription. Refund if analysis fails.</div>
                </div>
                <button
                  type="button"
                  data-testid={TID.imageCheck.payBtn}
                  onClick={startPayment}
                  disabled={!file}
                  className="btn-accent w-full md:w-auto inline-flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Pay ₹9 & analyze
                </button>
              </div>
            </div>
          )}

          {step === "pay" && (
            <div className="mt-8 card-soft bg-white p-8 text-center">
              <div className="text-[var(--yonii-muted)]">Opening secure payment…</div>
            </div>
          )}

          {step === "processing" && (
            <div className="mt-8 card-soft bg-white p-8 text-center">
              <div className="inline-flex items-center gap-2 text-[var(--yonii-primary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--yonii-primary)] animate-pulse" />
                Analyzing your image privately…
              </div>
              <div className="text-xs text-[var(--yonii-muted)] mt-2">Your image is processed in memory and will not be stored.</div>
            </div>
          )}

          {step === "result" && (
            <div className="mt-8 space-y-4">
              <div className="card-soft bg-white p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--yonii-primary)] mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Image processed & discarded</div>
                  <div className="text-[var(--yonii-muted)]">Your image was never saved on our servers.</div>
                </div>
              </div>
              <div data-testid={TID.imageCheck.result} className="card-soft bg-white p-6">
                <AIMessage text={result} />
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <button type="button" onClick={() => { setResult(""); setStep("upload"); setAnalysisId(""); }} className="btn-outline">
                  New analysis
                </button>
                <button
                  type="button"
                  data-testid={TID.imageCheck.deleteBtn}
                  onClick={deleteAnalysis}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete this analysis
                </button>
              </div>
            </div>
          )}

          <div className="mt-10"><Disclaimer /></div>
        </div>
      </div>
    </div>
  );
}
