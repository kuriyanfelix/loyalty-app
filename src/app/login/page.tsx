"use client";
// src/app/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo / Header */}
      <div className="text-center mb-10 fade-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-espresso-800 mb-4"
          style={{ backgroundColor: "var(--espresso)" }}>
          <span className="text-2xl">🥐</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-espresso-800" style={{ color: "var(--espresso)" }}>
          Crumb & Co
        </h1>
        <p className="text-sm mt-1 font-body" style={{ color: "var(--caramel)" }}>
          Loyalty Rewards
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden fade-up fade-up-delay-1"
        style={{ borderColor: "var(--cream-200)" }}>

        {/* Step indicator */}
        <div className="flex border-b" style={{ borderColor: "var(--cream-200)" }}>
          {(["phone", "otp"] as Step[]).map((s, i) => (
            <div key={s} className="flex-1 py-3 text-center text-xs font-medium transition-colors"
              style={{
                color: step === s ? "var(--caramel)" : "var(--stamp-empty)",
                borderBottom: step === s ? "2px solid var(--caramel)" : "2px solid transparent",
                marginBottom: "-1px",
              }}>
              {i + 1}. {s === "phone" ? "Phone Number" : "Verify Code"}
            </div>
          ))}
        </div>

        <div className="p-6">
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--espresso)" }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
                  style={{
                    borderColor: "var(--cream-200)",
                    backgroundColor: "var(--cream)",
                    color: "var(--espresso)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--caramel)")}
                  onBlur={e => (e.target.style.borderColor = "var(--cream-200)")}
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "var(--espresso)" }}>
                {loading ? "Sending…" : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--espresso)" }}>
                  6-Digit Code
                </label>
                <p className="text-xs mb-3" style={{ color: "var(--caramel)" }}>
                  Sent to {phone}
                </p>
                {devOtp && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "var(--cream-100)", color: "var(--caramel)" }}>
                    🔧 Dev mode — your code: <strong>{devOtp}</strong>
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border text-center text-2xl tracking-widest outline-none transition-all"
                  style={{
                    borderColor: "var(--cream-200)",
                    backgroundColor: "var(--cream)",
                    color: "var(--espresso)",
                    letterSpacing: "0.3em",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--caramel)")}
                  onBlur={e => (e.target.style.borderColor = "var(--cream-200)")}
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "var(--espresso)" }}>
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setOtp(""); setError(""); setDevOtp(""); }}
                className="w-full py-2 text-xs"
                style={{ color: "var(--caramel)" }}>
                ← Use a different number
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-center fade-up fade-up-delay-2"
        style={{ color: "var(--stamp-empty)" }}>
        Scan the QR code at the counter to get started
      </p>
    </div>
  );
}
