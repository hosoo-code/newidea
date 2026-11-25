"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// ⚠️ Эдгээр нь зөвхөн саад (deterrent). Утасны камер, гадны төхөөрөмж, зарим screen recorder-ийг
// браузераас бүрэн хориглох боломжгүй. Бодит хамгаалалт = DRM (Widevine/FairPlay).
// Watermark нь дэлгэц бичсэн/зураг авсан тохиолдолд задруулсан хэрэглэгчийг тодорхойлоход тусална.

type Pos = { top: number; left: number };
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randomPos = (): Pos => ({ top: rand(6, 82), left: rand(4, 62) });

function Watermark({ text, onTamper }: { text: string; onTamper: () => void }) {
  const [a, setA] = useState<Pos>({ top: 10, left: 8 });
  const [b, setB] = useState<Pos>({ top: 70, left: 45 });
  const [now, setNow] = useState(() => new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  // Байрлал өөрчлөгдөж байдаг тул тайрч хаах, тогтмол газар нь бүрхэх боломжгүй
  useEffect(() => {
    const t1 = setInterval(() => setA(randomPos()), 7000);
    const t2 = setInterval(() => setB(randomPos()), 11000);
    const t3 = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
    };
  }, []);

  // DevTools-оор устгах/нуух оролдлогыг илрүүлнэ → видеог зогсооно
  useEffect(() => {
    const el = rootRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const check = () => {
      const cs = getComputedStyle(el);
      const hidden = cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05;
      if (!parent.contains(el) || hidden) onTamper();
    };
    const mo = new MutationObserver(check);
    mo.observe(parent, { childList: true });
    mo.observe(el, { attributes: true, subtree: true, childList: true });
    const iv = setInterval(check, 2000);
    return () => {
      mo.disconnect();
      clearInterval(iv);
    };
  }, [onTamper]);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const label = `${text} • ${time}`;
  const style = (p: Pos, opacity: number): React.CSSProperties => ({
    position: "absolute",
    top: `${p.top}%`,
    left: `${p.left}%`,
    opacity,
    transition: "top 1.5s ease-in-out, left 1.5s ease-in-out",
    color: "#fff",
    textShadow: "0 0 3px rgba(0,0,0,.9), 0 0 6px rgba(0,0,0,.7)",
    fontSize: "clamp(10px, 1.6vw, 16px)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    userSelect: "none",
    pointerEvents: "none",
  });

  return (
    <div ref={rootRef} aria-hidden className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
      <span style={style(a, 0.35)}>{label}</span>
      <span style={style(b, 0.22)}>{label}</span>
    </div>
  );
}

export default function LocalPlayer({
  url,
  title,
  poster,
  movieId,
  viewerId,
}: {
  url: string;
  title: string;
  poster?: string | null;
  movieId?: number;
  viewerId?: string | null; // нэвтэрсэн хэрэглэгчийн id (watermark-д)
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [shield, setShield] = useState(false);
  const isFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.split("?")[0]) || /\.m3u8/i.test(url);
  // UUID-ийн эхний 8 тэмдэгт (бүтэн id-аар profiles хүснэгтээс хайж олно)
  const wmText = viewerId ? `ID: ${viewerId.slice(0, 8)}` : null;

  const onTamper = useCallback(() => {
    videoRef.current?.pause();
    setShield(true);
  }, []);

  // Видеоны native fullscreen нь зөвхөн <video>-г томруулж watermark-г алдагдуулдаг тул
  // watermark-тай хамт container-ийг бүтэн дэлгэц болгоно.
  const toggleFullscreen = () => {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
    else (videoRef.current as unknown as { webkitEnterFullscreen?: () => void } | null)?.webkitEnterFullscreen?.(); // iOS Safari (watermark харагдахгүй)
  };

  // Үргэлжлүүлж үзэх: байрлалыг localStorage-д хадгална
  useEffect(() => {
    const v = videoRef.current;
    if (!isFile || !v || movieId == null) return;
    const key = `cw:pos:${movieId}`;
    let lastSave = 0;
    const onMeta = () => {
      try {
        const t = Number(localStorage.getItem(key));
        if (t > 5 && t < v.duration - 30) v.currentTime = t;
      } catch {}
    };
    const onTime = () => {
      const now = Date.now();
      if (now - lastSave < 5000) return;
      lastSave = now;
      try {
        if (v.duration && v.currentTime > v.duration - 30) localStorage.removeItem(key);
        else localStorage.setItem(key, String(Math.floor(v.currentTime)));
      } catch {}
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [isFile, movieId]);

  useEffect(() => {
    if (!isFile) return;
    const cover = (ms?: number) => {
      videoRef.current?.pause();
      setShield(true);
      if (ms) setTimeout(() => setShield(false), ms);
    };
    const onVisibility = () => document.hidden && videoRef.current?.pause();
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        cover(3000);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Win+Shift+S / Cmd+Shift+3/4/5 – бүрэн барих боломжгүй ч түр халхална
      if ((e.shiftKey && (e.metaKey || e.ctrlKey) && ["s", "3", "4", "5"].includes(k)) || ((e.ctrlKey || e.metaKey) && k === "p")) {
        cover(3000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFile]);

  return (
    <div className="glass-container p-4 lg:p-6 select-none">
      <style>{`@media print { .protected-player { display: none !important; } }`}</style>
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">Watch {title}</h2>
      <div
        ref={boxRef}
        className="protected-player relative w-full aspect-video rounded-xl overflow-hidden bg-black"
        onContextMenu={(e) => e.preventDefault()}
      >
        {isFile ? (
          <>
            <video
              ref={videoRef}
              src={url}
              poster={poster ?? undefined}
              controls
              playsInline
              controlsList="nodownload noremoteplayback nofullscreen"
              disablePictureInPicture
              disableRemotePlayback
              className="absolute inset-0 w-full h-full"
            />
            {wmText && <Watermark text={wmText} onTamper={onTamper} />}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Бүтэн дэлгэц"
              className="absolute top-2 right-2 z-30 rounded bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1"
            >
              ⛶
            </button>
            {shield && (
              <div className="absolute inset-0 bg-black flex items-center justify-center text-gray-300 text-sm z-40">
                Хамгаалагдсан агуулга
              </div>
            )}
          </>
        ) : (
          <iframe
            src={url}
            sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
            referrerPolicy="no-referrer"
            title={`${title} - Video Player`}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}
