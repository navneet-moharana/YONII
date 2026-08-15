import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 text-xs text-[var(--yonii-muted)] leading-relaxed">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>YONII provides general educational information, not medical diagnosis. Consult a qualified healthcare professional for personal concerns.</span>
      </div>
    );
  }
  return (
    <div className="card-soft p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[var(--yonii-accent)] flex-shrink-0 mt-0.5" />
      <div className="text-sm text-[var(--yonii-text)]">
        <div className="font-medium mb-1">Educational information, not medical advice</div>
        <div className="text-[var(--yonii-muted)] leading-relaxed">
          YONII does not diagnose, prescribe or replace a qualified healthcare professional. For persistent, severe or worrying symptoms please seek in-person medical care.
        </div>
      </div>
    </div>
  );
}
