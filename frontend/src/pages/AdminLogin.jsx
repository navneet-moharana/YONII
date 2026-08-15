import React from "react";
import { useNavigate } from "react-router-dom";
import { http, setAdminToken } from "@/lib/api";
import { TID } from "@/constants/testIds";

export default function AdminLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await http.post("/admin/login", { email, password });
      setAdminToken(data.token);
      nav("/admin");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Invalid credentials");
    } finally { setBusy(false); }
  };

  return (
    <div className="yonii-container py-24">
      <div className="max-w-md mx-auto card-soft bg-white p-8">
        <div className="font-display text-2xl mb-2">Admin sign in</div>
        <div className="text-sm text-[var(--yonii-muted)] mb-6">Restricted to YONII operators.</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input data-testid={TID.admin.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                   className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input data-testid={TID.admin.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                   className="mt-2 w-full bg-[var(--yonii-surface)] rounded-xl px-4 py-2.5 outline-none text-sm" />
          </div>
          {err && <div className="text-sm text-[var(--yonii-accent)]">{err}</div>}
          <button data-testid={TID.admin.submit} type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
