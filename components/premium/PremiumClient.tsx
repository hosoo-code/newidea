"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Plan = { id: string; label: string; amount: number };
type Pay = { intentId: string; qrText?: string; qrImage?: string; links: string[]; raw: unknown };

// Wire-ийн next_action бүтэц operator-оос хамаарч өөр байж болох тул QR/холбоосыг уян хатан ялгана.
function extract(next: unknown): Pick<Pay, "qrText" | "qrImage" | "links"> {
  const out: { qrText?: string; qrImage?: string; links: string[] } = { links: [] };
  const walk = (v: unknown, key = "") => {
    if (typeof v === "string") {
      if (/^data:image\//.test(v) || (/^[A-Za-z0-9+/=]{200,}$/.test(v) && /qr.*(image|png)/i.test(key))) {
        out.qrImage ??= v.startsWith("data:") ? v : `data:image/png;base64,${v}`;
      } else if (/^https?:\/\//.test(v) || /^[a-z][a-z0-9+.-]*:\/\//i.test(v)) {
        if (/\.(png|jpe?g|svg)(\?|$)/i.test(v) && /qr/i.test(key)) out.qrImage ??= v;
        else out.links.push(v);
      } else if (/qr/i.test(key) && v.length > 20) out.qrText ??= v;
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(next);
  out.links = [...new Set(out.links)];
  return out;
}

export default function PremiumClient({ plans }: { plans: Plan[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [pay, setPay] = useState<Pay | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const router = useRouter();

  useEffect(() => () => clearInterval(timer.current), []);

  function poll(intentId: string) {
    clearInterval(timer.current);
    let tries = 0;
    timer.current = setInterval(async () => {
      tries++;
      try {
        const r = await fetch(`/api/payments/${intentId}`, { cache: "no-store" });
        const { status } = await r.json();
        if (status === "succeeded") {
          clearInterval(timer.current);
          toast.success("Төлбөр амжилттай! Premium идэвхжлээ 🎉");
          setPay(null);
          router.refresh();
        } else if (status === "failed") {
          clearInterval(timer.current);
          toast.error("Төлбөр амжилтгүй боллоо");
          setPay(null);
        }
      } catch {}
      if (tries > 150) clearInterval(timer.current); // ~10 мин
    }, 4000);
  }

  async function buy(plan: string) {
    setBusy(plan);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (res.status === 401) return void (location.href = "/login?next=/premium");
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      setPay({ intentId: json.intentId, raw: json.nextAction, ...extract(json.nextAction) });
      poll(json.intentId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="glass-container p-6 space-y-4 text-center">
            <h3 className="text-lg font-semibold text-white">{p.label}</h3>
            <p className="text-3xl font-bold text-theme-primary">{p.amount.toLocaleString("mn-MN")}₮</p>
            <button
              onClick={() => buy(p.id)}
              disabled={!!busy}
              className="w-full rounded-lg bg-theme-primary text-black font-semibold py-2 disabled:opacity-50"
            >
              {busy === p.id ? "..." : "QPay-аар төлөх"}
            </button>
          </div>
        ))}
      </div>

      {pay && (
        <div className="glass-container p-6 mt-6 text-center space-y-4">
          <h3 className="text-white font-semibold">QPay-аар төлнө үү</h3>
          {pay.qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pay.qrImage} alt="QPay QR" className="mx-auto w-56 h-56 bg-white p-2 rounded-lg" />
          ) : pay.qrText ? (
            <div className="mx-auto bg-white p-3 rounded-lg inline-block">
              <QRCodeSVG value={pay.qrText} size={208} />
            </div>
          ) : null}
          {pay.links.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {pay.links.map((l) => (
                <a
                  key={l}
                  href={l}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white hover:border-theme-primary"
                >
                  {l.startsWith("http") ? "Төлбөрийн хуудас нээх" : "Банкны апп нээх"}
                </a>
              ))}
            </div>
          )}
          {!pay.qrImage && !pay.qrText && pay.links.length === 0 && (
            <p className="text-gray-400 text-sm">Төлбөрийн заавар хүлээж авсангүй. Wire dashboard дээр QPay идэвхтэй эсэхийг шалгана уу.</p>
          )}
          <p className="text-xs text-gray-400">Төлбөр баталгаажихыг автоматаар хүлээж байна…</p>
        </div>
      )}
    </>
  );
}
