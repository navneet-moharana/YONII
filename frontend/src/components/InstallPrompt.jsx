import React from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "yonii_install_dismissed_v1";

export default function InstallPrompt() {
  const [deferred, setDeferred] = React.useState(null);
  const [visible, setVisible] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "yes") return;

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) { setInstalled(true); return; }

    const ua = window.navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    if (ios) { setIsIOS(true); setVisible(true); return; }

    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => { setInstalled(true); setVisible(false); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "yes");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferred(null);
  };

  if (installed || !visible) return null;

  return (
    <div
      data-testid="install-prompt"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-40 max-w-md md:max-w-sm card-soft bg-white border border-[var(--yonii-border)] p-4 flex items-start gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      role="dialog"
      aria-label="Install YONII"
    >
      <span className="w-9 h-9 rounded-full bg-[var(--yonii-primary)] flex items-center justify-center overflow-hidden flex-shrink-0">
        <img src="/yonii-icon-192.png" alt="" className="w-9 h-9 object-cover" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm font-medium">Install YONII on your home screen</div>
        {isIOS ? (
          <div className="text-xs text-[var(--yonii-muted)] mt-1 leading-relaxed">
            Tap the <span className="font-semibold">Share</span> button in Safari, then <span className="font-semibold">Add to Home Screen</span>.
          </div>
        ) : (
          <div className="text-xs text-[var(--yonii-muted)] mt-1 leading-relaxed">
            Quick access, works like an app, no store required.
          </div>
        )}
        {!isIOS && (
          <button
            type="button"
            data-testid="install-prompt-install"
            onClick={install}
            className="mt-3 btn-primary inline-flex items-center gap-2 text-xs px-4 py-2"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
        )}
      </div>
      <button
        type="button"
        data-testid="install-prompt-dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-1 rounded-full hover:bg-[var(--yonii-surface)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
