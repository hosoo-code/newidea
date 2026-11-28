"use client";
import { useRef } from "react";

// 4 тусдаа нүдтэй PIN оруулагч: автоматаар дараагийн нүд рүү шилжинэ, Backspace-аар буцна, буулгахыг дэмжинэ.
export default function PinInput({
  value,
  onChange,
  label,
  autoComplete = "one-time-code",
  reveal = false,
  invalid = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete?: string;
  reveal?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, 4));
  };

  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-sm font-medium text-gray-300">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type={reveal ? "text" : "password"}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? autoComplete : "off"}
            maxLength={1}
            value={d}
            aria-label={`${label} ${i + 1}`}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(-1);
              setAt(i, v);
              if (v && i < 3) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) {
                e.preventDefault();
                setAt(i - 1, "");
                refs.current[i - 1]?.focus();
              }
              if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < 3) refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
              if (!t) return;
              e.preventDefault();
              onChange(t);
              refs.current[Math.min(t.length, 3)]?.focus();
            }}
            className={`h-14 w-full rounded-xl border bg-gray-900/80 text-center text-2xl font-bold text-white outline-none transition-all
              ${invalid ? "border-red-500" : d ? "border-theme-primary/60" : "border-gray-700"}
              focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/30`}
          />
        ))}
      </div>
    </div>
  );
}
