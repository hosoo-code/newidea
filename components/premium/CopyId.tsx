"use client";
import { useState } from "react";

export default function CopyId({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        } catch {}
      }}
      className="shrink-0 rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-300 hover:border-theme-primary hover:text-white"
    >
      {ok ? "Хуулсан ✓" : "Хуулах"}
    </button>
  );
}
