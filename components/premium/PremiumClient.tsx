"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Plan = { id: string; label: string; amount: number; days: number };
type PayLink = { href: string; label: string; logo?: string; kind: "web" | "app" };
type Result = "success" | "failed" | "expired";
const PAY_SECONDS = 10 * 60; // төлбөрийн хугацаа
const fmt = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
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

export default function PremiumClient({
  plans,
  mode = "plans",
  extraBody,
  loginNext = "/premium",
}: {
  plans: Plan[];
  mode?: "plans" | "movie"; // "movie": нэг киноны худалдан авалт (plans[0] = {label: киноны нэр, amount})
  extraBody?: Record<string, unknown>;
  loginNext?: string;
}) {
  const isMovie = mode === "movie";
  const [busy, setBusy] = useState<string | null>(null);
  const [pay, setPay] = useState<Pay | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [left, setLeft] = useState(PAY_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const tick = useRef<ReturnType<typeof setInterval>>();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stopTimers = () => {
    clearInterval(timer.current);
    clearInterval(tick.current);
  };
  useEffect(() => stopTimers, []);

  const fetchStatus = async (intentId: string): Promise<string> => {
    try {
      const r = await fetch(`/api/payments/${intentId}`, { cache: "no-store" });
      return (await r.json()).status ?? "pending";
    } catch {
      return "pending";
    }
  };

  const finish = (r: Result) => {
    stopTimers();
    setResult(r);
    if (r === "success") toast.success(isMovie ? "Төлбөр амжилттай! Кино нээгдлээ 🎉" : "Төлбөр амжилттай! Premium идэвхжлээ 🎉");
  };

  const check = async (intentId: string) => {
    const status = await fetchStatus(intentId);
    if (status === "succeeded") finish("success");
    else if (status === "failed") finish("failed");
  };

  // Хугацаа дуусахад сүүлчийн удаа шалгаад, төлөгдсөн бол амжилттай, үгүй бол "хугацаа дууссан"
  const expire = async (intentId: string) => {
    stopTimers();
    finish((await fetchStatus(intentId)) === "succeeded" ? "success" : "expired");
  };

  function startCountdown(intentId: string) {
    clearInterval(tick.current);
    const endsAt = Date.now() + PAY_SECONDS * 1000;
    setLeft(PAY_SECONDS);
    tick.current = setInterval(() => {
      const secs = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setLeft(secs);
      if (secs === 0) expire(intentId);
    }, 1000);
  }

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
    const onVisible = () => document.visibilityState === "visible" && !result && check(pay.intentId);
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay, result]);

  // Төлбөрийн цонх нээлттэй үед ар талын scroll-ийг түгжинэ
  useEffect(() => {
    if (!pay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pay]);

  // X дарахад: үр дүн гарсан бол цонхыг хаана. Гараагүй бол сүүлчийн шалгалт хийнэ:
  // төлөгдсөн бол "амжилттай" харуулна, үгүй бол ямар ч "амжилтгүй" дэлгэц гаргалгүй чимээгүй хаана.
  // "Амжилтгүй/хугацаа дууссан" харсан ч төлсөн хэрэглэгч гараар дахин шалгана
  async function recheck() {
    if (!pay) return;
    if ((await fetchStatus(pay.intentId)) === "succeeded") finish("success");
    else toast.info("Төлбөр хараахан баталгаажаагүй байна. Төлсөн бол 1-2 минутын дараа дахин шалгана уу.");
  }

  async function closePay() {
    if (!pay) return;
    const reset = () => {
      stopTimers();
      setPay(null);
      setSelected(null);
      setResult(null);
    };
    if (result) {
      const ok = result === "success";
      reset();
      if (ok) router.refresh();
      return;
    }
    stopTimers();
    if ((await fetchStatus(pay.intentId)) === "succeeded") finish("success");
    else reset();
  }

  async function buy(plan: string) {
    setBusy(plan);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isMovie ? { ...extraBody } : { plan, ...extraBody }),
      });
      const json = await res.json();
      if (res.status === 401) return void (location.href = `/login?next=${encodeURIComponent(loginNext)}`);
      if (!res.ok) throw new Error(json.error ?? "Алдаа гарлаа");
      setShowAll(false);
      setSelected(plans.find((x) => x.id === plan) ?? null);
      setResult(null);
      setPay({ intentId: json.intentId, raw: json.nextAction, ...extract(json.nextAction) });
      poll(json.intentId);
      startCountdown(json.intentId);
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
      {isMovie && plans[0] && (
        <button
          type="button"
          onClick={() => buy(plans[0].id)}
          disabled={!!busy}
          className="w-full rounded-xl bg-theme-primary py-3.5 text-base font-bold text-black shadow-lg shadow-yellow-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "..." : `Худалдаж авах · ${plans[0].amount.toLocaleString("en-US")}₮`}
        </button>
      )}
      <div className={`grid grid-cols-1 gap-4 ${plans.length >= 3 ? "sm:grid-cols-2" : plans.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {(isMovie ? [] : plans).map((p) => {
          const perMonth = Math.round((p.amount / p.days) * 30);
          const best = plans.length > 1 && p.id === bestId;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col gap-4 rounded-2xl border p-5 text-center transition-all hover:-translate-y-0.5 ${
                best
                  ? "border-theme-primary bg-gradient-to-b from-yellow-400/10 to-gray-900/60 shadow-[0_0_24px_rgba(253,228,2,0.12)]"
                  : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
              }`}
            >
              {best && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-theme-primary px-3 py-1 text-[11px] font-bold text-black whitespace-nowrap">
                  ★ Хамгийн хэмнэлттэй
                </span>
              )}
              <h3 className="text-base font-semibold text-gray-200">{p.label}</h3>
              <p className="text-3xl font-extrabold text-white">
                {p.amount.toLocaleString("en-US")}
                <span className="ml-0.5 text-xl text-theme-primary">₮</span>
              </p>
              <p className="text-xs text-gray-400">сард ≈ {perMonth.toLocaleString("en-US")}₮</p>
              <button
                onClick={() => buy(p.id)}
                disabled={!!busy}
                className={`mt-auto w-full rounded-xl py-3 font-bold transition-all active:scale-95 disabled:opacity-50 ${
                  best ? "bg-theme-primary text-black" : "bg-gray-800 text-white border border-gray-700 hover:border-theme-primary"
                }`}
              >
                {busy === p.id ? "..." : "QPay-аар төлөх"}
              </button>
            </div>
          );
        })}
      </div>

      {pay && mounted && createPortal(
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
                <p className="text-xs text-gray-400">{isMovie ? "Кино худалдан авалт" : "Сонгосон багц"}</p>
                <h3 className="text-lg font-bold text-white">
                  {isMovie ? "" : "Premium · "}
                  {selected?.label}
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

            {result ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                    result === "success" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {result === "success" ? "✓" : "✕"}
                </div>
                <h4 className="text-xl font-bold text-white">
                  {result === "success" ? "Төлбөр амжилттай" : "Төлбөр амжилтгүй"}
                </h4>
                <p className="text-sm text-gray-400">
                  {result === "success"
                    ? isMovie
                      ? "Киног худалдан авлаа, одоо үзэж болно. Баярлалаа!"
                      : "Таны Premium эрх идэвхжлээ. Баярлалаа!"
                    : result === "expired"
                      ? "Төлбөрийн хугацаа дууслаа. Дахин оролдоно уу."
                      : "Төлбөр хийгдсэнгүй. Хэрэв төлсөн бол доорх товчоор дахин шалгана уу, эсвэл энэ хуудсыг дахин нээхэд эрх автоматаар олгогдоно."}
                </p>
                {result !== "success" && (
                  <button
                    type="button"
                    onClick={recheck}
                    className="w-full rounded-lg border border-theme-primary py-2.5 font-semibold text-theme-primary"
                  >
                    Төлсөн бол дахин шалгах
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePay}
                  className={`w-full rounded-lg py-2.5 font-semibold ${
                    result === "success" ? "bg-theme-primary text-black" : "bg-gray-800 text-white"
                  }`}
                >
                  {result === "success" ? "Үргэлжлүүлэх" : "Хаах"}
                </button>
              </div>
            ) : (
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

              <div className="order-4 space-y-1">
                <p className={`text-2xl font-bold tabular-nums ${left <= 60 ? "text-red-400" : "text-white"}`}>{fmt(left)}</p>
                <p className="text-xs text-gray-400">Төлбөр баталгаажихыг автоматаар хүлээж байна…</p>
              </div>
            </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
