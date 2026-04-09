"use client";
// src/app/admin/page.tsx
import { useState } from "react";

interface CustomerData {
  user: {
    id: string;
    phoneNumber: string;
    name: string | null;
    loyaltyAccount: { currentStamps: number; totalStampsEarned: number } | null;
    transactions: { id: string; type: string; amount: number; createdAt: string }[];
  };
  stampsPerReward: number;
  rewardsAvailable: number;
}

type SearchMode = "code" | "email";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("code");
  const [codeInput, setCodeInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminKey.trim()) return;
    setAuthed(true);
  }

  async function searchByCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/checkin/lookup?code=${encodeURIComponent(codeInput.toUpperCase())}`,
        { headers: { "x-admin-key": adminKey } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      setData(json);
      setCodeInput("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function searchByEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/customer?phone=${encodeURIComponent(emailInput)}`,
        { headers: { "x-admin-key": adminKey } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function addStamp() {
    if (!data) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/stamps/add", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ phoneNumber: data.user.phoneNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg("✓ Stamp added!");
      refreshCustomer(data.user.phoneNumber);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  async function redeemReward() {
    if (!data) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ phoneNumber: data.user.phoneNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg("🎁 Reward redeemed!");
      refreshCustomer(data.user.phoneNumber);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  }

  async function refreshCustomer(phone: string) {
    const res = await fetch(
      `/api/admin/customer?phone=${encodeURIComponent(phone)}`,
      { headers: { "x-admin-key": adminKey } }
    );
    const json = await res.json();
    if (res.ok) setData(json);
    setLoading(false);
  }

  const stamps = data?.user.loyaltyAccount?.currentStamps ?? 0;
  const spr = data?.stampsPerReward ?? 10;
  const rewards = data?.rewardsAvailable ?? 0;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ backgroundColor: "var(--espresso)" }}>
              <span className="text-xl">🔐</span>
            </div>
            <h1 className="font-display text-2xl font-bold" style={{ color: "var(--espresso)" }}>
              Staff Portal
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--caramel)" }}>Crumb & Co</p>
          </div>
          <form onSubmit={handleAdminLogin}
            className="bg-white rounded-2xl p-6 shadow-sm border space-y-4"
            style={{ borderColor: "var(--cream-200)" }}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--espresso)" }}>
                Staff Access Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                placeholder="Enter access key"
                className="w-full px-4 py-3 rounded-xl border text-base outline-none"
                style={{ borderColor: "var(--cream-200)", backgroundColor: "var(--cream)", color: "var(--espresso)" }}
                onFocus={e => (e.target.style.borderColor = "var(--caramel)")}
                onBlur={e => (e.target.style.borderColor = "var(--cream-200)")}
              />
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "var(--espresso)" }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <header className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: "var(--caramel)" }}>
            Staff Portal
          </p>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--espresso)" }}>
            Crumb & Co
          </h1>
        </div>
        <button onClick={() => { setAuthed(false); setAdminKey(""); setData(null); }}
          className="text-xs px-3 py-1.5 rounded-full border"
          style={{ borderColor: "var(--cream-200)", color: "var(--espresso)" }}>
          Sign out
        </button>
      </header>

      <div className="px-5 pb-12 space-y-4">

        {/* Search mode toggle */}
        <div className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--cream-200)", backgroundColor: "white" }}>
          {(["code", "email"] as SearchMode[]).map(mode => (
            <button key={mode}
              onClick={() => { setSearchMode(mode); setData(null); setError(""); }}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: searchMode === mode ? "var(--espresso)" : "transparent",
                color: searchMode === mode ? "white" : "var(--espresso)",
              }}>
              {mode === "code" ? "🏪 Check-In Code" : "✉️ Email"}
            </button>
          ))}
        </div>

        {/* Code search */}
        {searchMode === "code" && (
          <form onSubmit={searchByCode}
            className="bg-white rounded-2xl p-5 border shadow-sm space-y-3"
            style={{ borderColor: "var(--cream-200)" }}>
            <p className="text-xs" style={{ color: "var(--espresso)", opacity: 0.6 }}>
              Ask the customer to open their app and tap "Check In at Counter"
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
                placeholder="A3F7"
                maxLength={4}
                autoFocus
                className="flex-1 px-4 py-4 rounded-xl border text-center font-display text-3xl tracking-widest outline-none uppercase"
                style={{
                  borderColor: "var(--cream-200)",
                  backgroundColor: "var(--cream)",
                  color: "var(--espresso)",
                  letterSpacing: "0.3em",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--caramel)")}
                onBlur={e => (e.target.style.borderColor = "var(--cream-200)")}
              />
              <button type="submit"
                disabled={loading || codeInput.length !== 4}
                className="px-5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--espresso)" }}>
                {loading ? "…" : "Find"}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </form>
        )}

        {/* Email search */}
        {searchMode === "email" && (
          <form onSubmit={searchByEmail}
            className="bg-white rounded-2xl p-4 border shadow-sm"
            style={{ borderColor: "var(--cream-200)" }}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--espresso)" }}>
              Customer Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="customer@example.com"
                className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "var(--cream-200)", backgroundColor: "var(--cream)", color: "var(--espresso)" }}
                onFocus={e => (e.target.style.borderColor = "var(--caramel)")}
                onBlur={e => (e.target.style.borderColor = "var(--cream-200)")}
              />
              <button type="submit"
                disabled={loading || !emailInput}
                className="px-5 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--espresso)" }}>
                {loading ? "…" : "Find"}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </form>
        )}

        {/* Customer card */}
        {data && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border shadow-sm"
              style={{ borderColor: "var(--cream-200)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: "var(--espresso)" }}>
                  {data.user.name ? data.user.name[0].toUpperCase() : "✉"}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: "var(--espresso)" }}>
                    {data.user.name || "Customer"}
                  </p>
                  <p className="text-xs opacity-50" style={{ color: "var(--espresso)" }}>
                    {data.user.phoneNumber}
                  </p>
                </div>
              </div>

              {/* Stamp count */}
              <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: "var(--cream-100)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--caramel)" }}>
                      Current Stamps
                    </p>
                    <p className="font-display text-4xl font-bold" style={{ color: "var(--espresso)" }}>
                      {stamps}
                      <span className="text-base font-body opacity-40 ml-1">/ {spr}</span>
                    </p>
                  </div>
                  {rewards > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: "var(--caramel)" }}>
                      🎁 {rewards} ready
                    </div>
                  )}
                </div>
                <div className="grid gap-1.5 mt-3"
                  style={{ gridTemplateColumns: `repeat(${Math.min(spr, 10)}, minmax(0, 1fr))` }}>
                  {Array.from({ length: Math.min(spr, 10) }, (_, i) => (
                    <div key={i} className="aspect-square rounded"
                      style={{ backgroundColor: i < stamps ? "var(--caramel)" : "var(--stamp-empty)" }} />
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={addStamp} disabled={loading}
                  className="py-4 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-transform active:scale-95"
                  style={{ backgroundColor: "var(--espresso)" }}>
                  <span className="block text-xl mb-1">✦</span>
                  Add Stamp
                </button>
                <button onClick={redeemReward} disabled={loading || rewards === 0}
                  className="py-4 rounded-xl text-sm font-medium disabled:opacity-40 transition-transform active:scale-95"
                  style={{
                    backgroundColor: rewards > 0 ? "var(--caramel)" : "var(--stamp-empty)",
                    color: rewards > 0 ? "white" : "var(--espresso)",
                  }}>
                  <span className="block text-xl mb-1">🎁</span>
                  Redeem Reward
                </button>
              </div>

              {successMsg && (
                <div className="mt-3 px-4 py-2.5 rounded-xl text-sm font-medium text-center"
                  style={{ backgroundColor: "var(--cream-100)", color: "var(--caramel)" }}>
                  {successMsg}
                </div>
              )}
              {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}
            </div>

            {/* Recent transactions */}
            {data.user.transactions.length > 0 && (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm"
                style={{ borderColor: "var(--cream-200)" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "var(--cream-200)" }}>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--caramel)" }}>
                    Recent Activity
                  </p>
                </div>
                {data.user.transactions.map((t, i) => (
                  <div key={t.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderTop: i > 0 ? "1px solid var(--cream-200)" : "none" }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{t.type === "ADD_STAMP" ? "✦" : "🎁"}</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--espresso)" }}>
                          {t.type === "ADD_STAMP" ? `Stamp added (+${t.amount})` : "Reward redeemed"}
                        </p>
                        <p className="text-xs opacity-40" style={{ color: "var(--espresso)" }}>
                          {timeAgo(t.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs"
                      style={{ color: t.type === "ADD_STAMP" ? "var(--caramel)" : "var(--espresso)" }}>
                      {t.type === "ADD_STAMP" ? `+${t.amount}` : `-${t.amount}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
