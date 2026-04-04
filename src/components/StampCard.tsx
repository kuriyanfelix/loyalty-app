// src/components/StampCard.tsx
"use client";

interface StampCardProps {
  currentStamps: number;
  stampsPerReward: number;
}

export default function StampCard({ currentStamps, stampsPerReward }: StampCardProps) {
  const cols = stampsPerReward <= 6 ? stampsPerReward : Math.ceil(Math.sqrt(stampsPerReward));
  const stamps = Array.from({ length: stampsPerReward }, (_, i) => i < currentStamps);

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--espresso) 0%, var(--espresso-light) 100%)",
        boxShadow: "0 8px 32px rgba(44,22,8,0.25)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: "var(--caramel)" }} />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: "var(--caramel-light)" }} />

      {/* Card header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <p className="text-xs font-medium opacity-60 text-white uppercase tracking-widest">Loyalty Card</p>
          <h2 className="font-display text-xl font-bold text-white mt-0.5">Crumb & Co</h2>
        </div>
        <span className="text-2xl">☕</span>
      </div>

      {/* Stamp grid */}
      <div
        className="grid gap-2 my-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {stamps.map((filled, i) => (
          <div
            key={i}
            className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all ${
              filled ? "stamp-animate" : ""
            }`}
            style={{
              backgroundColor: filled ? "var(--caramel)" : "rgba(255,255,255,0.12)",
              border: filled ? "none" : "1.5px dashed rgba(255,255,255,0.25)",
              animationDelay: filled ? `${i * 0.04}s` : "0s",
            }}
          >
            {filled && <span style={{ fontSize: "0.7rem" }}>✦</span>}
          </div>
        ))}
      </div>

      {/* Progress text */}
      <div className="flex items-center justify-between mt-3 relative">
        <p className="text-xs text-white opacity-60">
          {currentStamps} of {stampsPerReward} stamps
        </p>
        <div className="h-1.5 rounded-full overflow-hidden flex-1 mx-3"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(currentStamps / stampsPerReward) * 100}%`,
              backgroundColor: "var(--caramel-light)",
            }}
          />
        </div>
        <p className="text-xs text-white opacity-60">
          {stampsPerReward - currentStamps > 0
            ? `${stampsPerReward - currentStamps} to go`
            : "🎉 Ready!"}
        </p>
      </div>
    </div>
  );
}
