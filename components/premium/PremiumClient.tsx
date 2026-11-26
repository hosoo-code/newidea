"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Plan = { id: string; label: string; amount: number; days: number };
type PayLink = { href: string; label: string; logo?: string; kind: "web" | "app" };
type Pay = { intentId: string; qrText?: string; qrImage?: string; links: PayLink[]; raw: unknown };

const IMG_KEY = /logo|icon|image|img|avatar|thumb/i;
const IMG_URL = /\.(png|jpe?g|svg|webp|gif)(\?|$)/i;
const LINK_KEYS = ["link", "deeplink", "deep_link", "url", "href"];
const NAME_KEYS = ["name", "description", "title", "label", "bank"];

const isUrl = (v: unknown): v is string => typeof v === "string" && /^[a-z][a-z0-9+.-]*:\/\//i.test(v);
const firstStr = (o: Record<string, unknown>, keys: string[]) =>
  keys.map((k) => o[k]).find((x): x is string => typeof x === "string" && x.length > 0);

// Wire-ийн next_action бүтэц operator-оос хамаарч өөр байж болох тул QR/холбоосыг уян хатан ялгана.
// Банкны logo (зургийн URL) нь холбоос биш тул алгасна; банк бүрийн {name, link, logo} объектыг нэг товч болгоно.
function extract(next: unknown): Pick<Pay, "qrText" | "qrImage" | "links"> {
  const out: { qrText?: string; qrImage?: string; links: PayLink[] } = { links: [] };
  const addLink = (href: string, label?: string, logo?: string) => {
    if (IMG_URL.test(href)) return;
    out.links.push({
      href,
      label: label ?? "",
      logo: logo && isUrl(logo) ? logo : undefined,
      kind: /^https?:\/\//i.test(href) ? "web" : "app",
    });
  };
  const walk = (v: unknown, key = "") => {
    if (typeof v === "string") {
      if (/^data:image\//.test(v) || (/^[A-Za-z0-9+/=]{200,}$/.test(v) && /qr.*(image|png)/i.test(key))) {
        out.qrImage ??= v.startsWith("data:") ? v : `data:image/png;base64,${v}`;
      } else if (isUrl(v)) {
        if (IMG_URL.test(v) && /qr/i.test(key)) out.qrImage ??= v;
        else if (!IMG_KEY.test(key)) addLink(v);
      } else if (/qr/i.test(key) && (v as string).length > 20) out.qrText ??= v as string;
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const href = LINK_KEYS.map((k) => o[k]).find(isUrl);
      if (href && !/qr/i.test(key)) {
        // банк/апп бүрийн объект: нэр + logo + холбоос
        const logoKey = Object.keys(o).find((k) => IMG_KEY.test(k) && isUrl(o[k]));
        addLink(href, firstStr(o, NAME_KEYS), logoKey ? (o[logoKey] as string) : undefined);
        Object.entries(o).forEach(([k, x]) => {
          if (!LINK_KEYS.includes(k) && !NAME_KEYS.includes(k) && !IMG_KEY.test(k) && typeof x === "object") walk(x, k);
        });
      } else Object.entries(o).forEach(([k, x]) => walk(x, k));
    }
  };
  walk(next);
  const seen = new Set<string>();
  out.links = out.links.filter((l) => !seen.has(l.href) && !!seen.add(l.href));
  return out;
}

export default function PremiumClient({ plans }: { plans: Plan[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [pay, setPay] = useState<Pay | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [showAll, setShowAll] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const router = useRouter();

  useEffect(() => () => clearInterval(timer.current), []);

  const check = async (intentId: string) => {
    try {
      const r = await fetch(`/api/payments/${intentId}`, { cache: "no-store" });
      const { status } = await r.json();
      if (status === "succeeded") {
        clearInterval(timer.current);
        toast.success("Төлбөр амжилттай! Premium идэвхжлээ 🎉");
        setPay(null);
        setSelected(null);
        router.refresh();
      } else if (status === "failed") {
        clearInterval(timer.current);
        toast.error("Төлбөр амжилтгүй боллоо");
        setPay(null);
        setSelected(null);
      }
    } catch {}
  };

  function poll(intentId: string) {
    clearInterval(timer.current);
    let tries = 0;
    timer.current = setInterval(() => {
      tries++;
      check(intentId);
      if (tries > 150) clearInterval(timer.current); // ~10 мин
    }, 4000);
  }

  // Банкны аппаас буцаж ирэхэд төлбөрийг шууд шалгана
  useEffect(() => {
    if (!pay) return;
    const onVisible = () => document.visibilityState === "visible" && check(pay.intentId);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay]);

  // Төлбөрийн цонх нээлттэй үед ар талын scroll-ийг түгжинэ
  useEffect(() => {
    if (!pay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pay]);

  function closePay() {
    clearInterval(timer.current);
    setPay(null);
    setSelected(null);
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
      setShowAll(false);
      setSelected(plans.find((x) => x.id === plan) ?? null);
      setPay({ intentId: json.intentId, raw: json.nextAction, ...extract(json.nextAction) });
      poll(json.intentId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setBusy(null);
    }
  }

  const bestId = [...plans].sort((a, b) => a.amount / a.days - b.amount / b.days)[0]?.id;
  const webLink = pay?.links.find((l) => l.kind === "web");
  const appLinks = pay?.links.filter((l) => l.kind === "app") ?? [];

  return (
    <>
      <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${plans.length >= 4 ? "sm:grid-cols-2" : plans.length === 3 ? "sm:grid-cols-3" : plans.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {plans.map((p) => {
          const perMonth = Math.round((p.amount / p.days) * 30);
          const best = plans.length > 1 && p.id === bestId;
          return (
            <div
              key={p.id}
              className={`glass-container relative text-center space-y-3 ${best ? "!border-theme-primary" : ""}`}
            >
              {best && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-theme-primary px-2.5 py-0.5 text-[11px] font-semibold text-black whitespace-nowrap">
                  Хамгийн хэмнэлттэй
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{p.label}</h3>
              <p className="text-2xl sm:text-3xl font-bold text-theme-primary">{p.amount.toLocaleString("en-US")}₮</p>
              <p className="text-xs text-gray-400">
                {p.days} хоног · сард ≈ {perMonth.toLocaleString("en-US")}₮
              </p>
              <button
                onClick={() => buy(p.id)}
                disabled={!!busy}
                className="w-full rounded-lg bg-theme-primary text-black font-semibold py-2.5 disabled:opacity-50"
              >
                {busy === p.id ? "..." : "QPay-аар төлөх"}
              </button>
            </div>
          );
        })}
      </div>

      {pay && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && closePay()}
        >
          <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-gray-900 border border-gray-800 p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Сонгосон багц */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-400">Сонгосон багц</p>
                <h3 className="text-lg font-bold text-white">
                  Premium · {selected?.label}
                  {selected && <span className="ml-2 text-sm font-normal text-gray-400">({selected.days} хоног)</span>}
                </h3>
                {selected && <p className="text-2xl font-bold text-theme-primary">{selected.amount.toLocaleString("en-US")}₮</p>}
              </div>
              <button
                type="button"
                onClick={closePay}
                aria-label="Хаах"
                className="shrink-0 rounded-lg bg-gray-800 px-3 py-1.5 text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 text-center">
              {appLinks.length > 0 && (
                <div className="order-1 sm:order-2 space-y-2">
                  <p className="text-sm text-gray-300">Банкны аппаа сонгож төлнө үү</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(showAll ? appLinks : appLinks.slice(0, 9)).map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        className="flex flex-col items-center gap-1 rounded-lg bg-gray-800 border border-gray-700 px-2 py-3 text-xs text-white hover:border-theme-primary active:scale-95"
                      >
                        {l.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.logo} alt="" className="w-10 h-10 rounded-lg" loading="lazy" />
                        )}
                        <span className="line-clamp-2">{l.label || "Банкны апп"}</span>
                      </a>
                    ))}
                  </div>
                  {appLinks.length > 9 && (
                    <button type="button" onClick={() => setShowAll((x) => !x)} className="text-xs text-theme-primary underline">
                      {showAll ? "Цөөн харуулах" : `Бусад банк (${appLinks.length - 9})`}
                    </button>
                  )}
                </div>
              )}

              {(pay.qrImage || pay.qrText) && (
                <div className="order-2 sm:order-1 space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="sm:hidden">Эсвэл өөр төхөөрөмжөөс QR уншуулна уу</span>
                    <span className="hidden sm:inline">QPay QR уншуулна уу</span>
                  </p>
                  {pay.qrImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pay.qrImage} alt="QPay QR" className="mx-auto w-full max-w-[14rem] aspect-square bg-white p-2 rounded-lg" />
                  ) : (
                    <div className="mx-auto bg-white p-3 rounded-lg inline-block">
                      <QRCodeSVG value={pay.qrText!} size={208} />
                    </div>
                  )}
                </div>
              )}

              {webLink && (
                <a
                  href={webLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-3 inline-block rounded-lg bg-theme-primary text-black font-semibold px-4 py-2.5 text-sm"
                >
                  Төлбөрийн хуудас нээх
                </a>
              )}

              {!pay.qrImage && !pay.qrText && !webLink && appLinks.length === 0 && (
                <p className="text-gray-400 text-sm">Төлбөрийн заавар хүлээж авсангүй. Wire dashboard дээр QPay идэвхтэй эсэхийг шалгана уу.</p>
              )}

              <p className="order-4 text-xs text-gray-400">Төлбөр баталгаажихыг автоматаар хүлээж байна…</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
