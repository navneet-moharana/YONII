import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ShieldCheck, HeartPulse } from "lucide-react";
import { TID } from "@/constants/testIds";
import InstallPrompt from "@/components/InstallPrompt";

const NAV = [
  { to: "/chat", label: "Ask AI", tid: TID.nav.ask },
  { to: "/hub/mens-health", label: "Men's Health", tid: TID.nav.mens },
  { to: "/hub/womens-health", label: "Women's Health", tid: TID.nav.womens },
  { to: "/hub/sti-std", label: "STI & STD", tid: TID.nav.sti },
  { to: "/hub/contraception", label: "Contraception", tid: TID.nav.contra },
  { to: "/hub/sexual-wellness", label: "Wellness", tid: TID.nav.wellness },
  { to: "/hub/relationships", label: "Relationships", tid: TID.nav.relationships },
  { to: "/period-tracker", label: "Period Tracker", tid: "nav-period-tracker" },
  { to: "/image-check", label: "Image Check ₹9", tid: TID.nav.imageCheck, accent: true },
];

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  React.useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="glass-nav sticky top-0 z-40">
      <div className="yonii-container flex items-center justify-between h-16">
        <Link to="/" data-testid={TID.nav.logo} className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-full bg-[var(--yonii-primary)] flex items-center justify-center overflow-hidden">
            <img src="/yonii-logo.png" alt="YONII" className="w-6 h-6 object-contain" />
          </span>
          <span className="font-display font-semibold text-lg tracking-tight">
            YONII
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.tid}
              className={({ isActive }) =>
                `text-sm px-3 py-2 rounded-full transition-colors ${
                  n.accent
                    ? "bg-[var(--yonii-accent)] text-white hover:bg-[var(--yonii-accent-hover)]"
                    : isActive
                    ? "bg-[var(--yonii-surface)] text-[var(--yonii-text)]"
                    : "text-[var(--yonii-muted)] hover:text-[var(--yonii-text)] hover:bg-[var(--yonii-surface)]"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--yonii-muted)]">
          <ShieldCheck className="w-4 h-4" />
          <span>No sign-up</span>
        </div>

        <button
          type="button"
          data-testid={TID.nav.mobileToggle}
          className="lg:hidden p-2 rounded-full hover:bg-[var(--yonii-surface)]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[var(--yonii-border)] bg-[var(--yonii-bg)]">
          <div className="yonii-container py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`${n.tid}-mobile`}
                className={`text-sm px-3 py-2.5 rounded-xl ${
                  n.accent
                    ? "bg-[var(--yonii-accent)] text-white"
                    : "text-[var(--yonii-text)] hover:bg-[var(--yonii-surface)]"
                }`}
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/privacy"
              data-testid={`${TID.nav.privacy}-mobile`}
              className="text-sm px-3 py-2.5 rounded-xl text-[var(--yonii-muted)]"
            >
              Privacy
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--yonii-border)] bg-[var(--yonii-surface)]">
      <div className="yonii-container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[var(--yonii-primary)] flex items-center justify-center overflow-hidden">
              <img src="/yonii-logo.png" alt="YONII" className="w-5 h-5 object-contain" />
            </span>
            <div className="font-display font-semibold text-lg">YONII</div>
          </div>
          <p className="text-sm text-[var(--yonii-muted)] mt-2 max-w-xs">
            Your private sexual-health companion. Ask. Understand. Take care.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Explore</div>
          <ul className="space-y-2 text-sm">
            <li><Link className="link-underline" to="/chat">Ask AI</Link></li>
            <li><Link className="link-underline" to="/symptom-checker">Symptom Checker</Link></li>
            <li><Link className="link-underline" to="/period-tracker">Period Tracker</Link></li>
            <li><Link className="link-underline" to="/image-check">Image Health Check</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Learn</div>
          <ul className="space-y-2 text-sm">
            <li><Link className="link-underline" to="/hub/mens-health">Men's Health</Link></li>
            <li><Link className="link-underline" to="/hub/womens-health">Women's Health</Link></li>
            <li><Link className="link-underline" to="/hub/sti-std">STI & STD</Link></li>
            <li><Link className="link-underline" to="/hub/contraception">Contraception</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--yonii-muted)] mb-3">Trust</div>
          <ul className="space-y-2 text-sm">
            <li><Link className="link-underline" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="link-underline" to="/terms">Terms of Use</Link></li>
            <li><Link className="link-underline" to="/disclaimer">Medical Disclaimer</Link></li>
            <li><Link className="link-underline" to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--yonii-border)]">
        <div className="yonii-container py-4 text-xs text-[var(--yonii-muted)] flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} YONII. For adults 18+. Educational information only.</div>
          <div className="font-editorial italic">Ask. Understand. Take care.</div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
