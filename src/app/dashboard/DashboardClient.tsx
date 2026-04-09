"use client";
// src/app/dashboard/DashboardClient.tsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StampCard from "@/components/StampCard";

interface Transaction {
  id: string;
  type: "ADD_STAMP" | "REDEEM";
  amount: number;
  createdAt: string;
}

interface Props {
  phone: string;
  name: string | null;
  currentStamps: number;
  totalStampsEarned: number;
  stampsPerReward: number;
  rewardsAvailable: number;
  transactions: Transaction[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardClient({
  phone, name, currentStamps, totalStampsEarned,
  stampsPerReward, rewardsAvailable, transactions,
}: Props) {
  const router = useRouter();
  const [checkInCode, setCheckInCode] = useState<string | null>(null);
  const [checkInExpiry, setCheckInExpiry] = useState<Date | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (!checkInExpiry) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((checkInExpiry.getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setCheckInCode(null);
        setCheckInExpiry(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInExpiry]);

  const generateCheckIn = useCallback(async () => {
    setCheckInLoading(true);
    try {
      const res = await fetch("/api/checkin/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCheckInCode(data.code);
      setCheckInExpiry(new Date(data.expiresAt));
      setSecondsLeft(300);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckInLoading(false);
    }
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <header className="px-5 pt-10 pb-4 flex items-start justify-between">
        <div className="fade-up">
          <p className="text-xs font-medium uppercase tracking-widest mb-0.5"
            style={{ color: "var(--caramel)" }}>
            Welcome back
          </p>
          <h1 className="font-display text-2xl font-bold" style={{ color: "var(--espresso)" }}>
            {name || phone}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-full border transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--cream-200)", color: "var(--espresso)" }}>
          Sign out
        </button>
      </header>

      <div className="px-5 space-y-5 pb-12">
        {/* Stamp Card */}
        <div className="fade-up fade-up-delay-1">
          <StampCard currentStamps={currentStamps} stampsPerReward={stampsPerReward} />
        </div>

        {/* CHECK IN BUTTON / CODE DISPLAY */}
        <div className="fade-up fade-up-delay-2">
          {!checkInCode ? (
            <button
              onClick={generateCheckIn}
              disabled={checkInLoading}
              className="w-full py-5 rounded-2xl text-white font-medium text-base transition-transform active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--caramel) 0%, var(--caramel-light) 100%)",
                boxShadow: "0 4px 20px rgba(200,118,58,0.35)",
              }}>
              {checkInLoading ? "Generating…" : "🏪  Check In at Counter"}
            </button>
          ) : (
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: "linear-gradient(135deg, var(--espresso) 0%, var(--espresso-light) 100%)",
                boxShadow: "0 8px 32px rgba(44,22,8,0.25)",
              }}>
              <p className="text-xs uppercase tracking-widest mb-3 opacity-60 text-white">
                Show this code to staff
              </p>
              {/* Big code display */}
              <div className="flex items-center justify-center gap-3 my-3">
                {checkInCode.split("").map((char, i) => (
                  <div key={i}
                    className="w-16 h-20 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <span className="font-display text-4xl font-bold text-white">
                      {char}
                    </span>
                  </div>
                ))}
              </div>
              {/* Countdown */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-1 rounded-full flex-1 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(secondsLeft / 300) * 100}%`,
                      backgroundColor: secondsLeft < 60 ? "#ef4444" : "var(--caramel-light)",
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-white opacity-70 w-10 text-right">
                  {mins}:{secs.toString().padStart(2, "0")}
                </span>
              </div>
              <button
                onClick={generateCheckIn}
                className="mt-4 text-xs opacity-50 text-white hover:opacity-80 transition-opacity">
                Generate new code
              </button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 fade-up fade-up-delay-2">
          <div className="rounded-xl p-4 border"
            style={{ backgroundColor: "white", borderColor: "var(--cream-200)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--caramel)" }}>
              Total Earned
            </p>
            <p className="font-display text-3xl font-bold" style={{ color: "var(--espresso)" }}>
              {totalStampsEarned}
            </p>
            <p className="text-xs opacity-50 mt-0.5" style={{ color: "var(--espresso)" }}>stamps</p>
          </div>

          <div className="rounded-xl p-4 border relative overflow-hidden"
            style={{
              backgroundColor: rewardsAvailable > 0 ? "var(--espresso)" : "white",
              borderColor: "var(--cream-200)",
            }}>
            {rewardsAvailable > 0 && (
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
                style={{ backgroundColor: "var(--caramel)" }} />
            )}
            <p className="text-xs uppercase tracking-wider mb-1"
              style={{ color: rewardsAvailable > 0 ? "rgba(255,255,255,0.6)" : "var(--caramel)" }}>
              Rewards
            </p>
            <p className="font-display text-3xl font-bold"
              style={{ color: rewardsAvailable > 0 ? "white" : "var(--espresso)" }}>
              {rewardsAvailable}
            </p>
            <p className="text-xs mt-0.5"
              style={{ color: rewardsAvailable > 0 ? "rgba(255,255,255,0.5)" : "rgba(44,22,8,0.4)" }}>
              {rewardsAvailable > 0 ? "ready to redeem!" : "available"}
            </p>
          </div>
        </div>

        {/* Reward banner */}
        {rewardsAvailable > 0 && (
          <div className="rounded-xl p-4 flex items-center gap-3 fade-up"
            style={{ backgroundColor: "var(--caramel)", color: "white" }}>
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-medium text-sm">
                You have {rewardsAvailable} free reward{rewardsAvailable > 1 ? "s" : ""}!
              </p>
              <p className="text-xs opacity-80 mt-0.5">Staff will apply it when you check in</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {rewardsAvailable === 0 && (
          <div className="rounded-xl p-4 border fade-up fade-up-delay-2"
            style={{ backgroundColor: "white", borderColor: "var(--cream-200)" }}>
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--espresso)" }}>
              <span className="font-medium">Next free item</span>
              <span style={{ color: "var(--caramel)" }}>
                {stampsPerReward - currentStamps} stamp{stampsPerReward - currentStamps !== 1 ? "s" : ""} away
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--cream-200)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(currentStamps / stampsPerReward) * 100}%`,
                  backgroundColor: "var(--caramel)",
                }}
              />
            </div>
            <p className="text-xs mt-2 opacity-50" style={{ color: "var(--espresso)" }}>
              Every {stampsPerReward} purchases = 1 free item of your choice
            </p>
          </div>
        )}

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="fade-up fade-up-delay-3">
            <h2 className="font-display text-base font-semibold mb-3" style={{ color: "var(--espresso)" }}>
              Recent Activity
            </h2>
            <div className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--cream-200)", backgroundColor: "white" }}>
              {transactions.map((t, i) => (
                <div key={t.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--cream-200)" : "none" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: t.type === "ADD_STAMP" ? "var(--cream-100)" : "rgba(200,118,58,0.12)" }}>
                      <span className="text-sm">{t.type === "ADD_STAMP" ? "✦" : "🎁"}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--espresso)" }}>
                        {t.type === "ADD_STAMP" ? `+${t.amount} stamp${t.amount > 1 ? "s" : ""}` : "Reward redeemed"}
                      </p>
                      <p className="text-xs opacity-40" style={{ color: "var(--espresso)" }}>
                        {timeAgo(t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium"
                    style={{ color: t.type === "ADD_STAMP" ? "var(--caramel)" : "var(--espresso)" }}>
                    {t.type === "ADD_STAMP" ? `+${t.amount}` : `-${t.amount}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
