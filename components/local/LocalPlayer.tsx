"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, Loader2, ExternalLink } from "lucide-react";

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

const SPEEDS = [1, 1.25, 1.5, 2, 0.75];
const fmt = (t: number) => {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? h + ":" : ""}${mm}:${String(s).padStart(2, "0")}`;
};

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
  // Нэвтрээгүй зочин (үнэгүй кино) – ID байхгүй тул брэндийн watermark
  const wmText = viewerId ? `ID: ${viewerId.slice(0, 8)}` : "Kino Mangas";

  // --- Тоглуулагчийн төлөв ---
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [fs, setFs] = useState(false);
  const [ratio, setRatio] = useState(16 / 9); // видеоны жинхэнэ харьцаа (metadata ирэхэд шинэчлэгдэнэ)
  const [showUI, setShowUI] = useState(true);
  const [flash, setFlash] = useState<{ side: "l" | "r"; n: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef<{ t: number; side: "l" | "r" | "c" }>({ t: 0, side: "c" });
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTamper = useCallback(() => {
    videoRef.current?.pause();
    setShield(true);
  }, []);

  const wake = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowUI(false);
    }, 3000);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    wake();
  };
  const seekBy = (d: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0) - 0.1, v.currentTime + d));
    wake();
  };
  const cycleSpeed = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    v.playbackRate = next;
    setSpeed(next);
    wake();
  };
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.volume === 0) { v.volume = 0.5; setVolume(0.5); }
    wake();
  };
  // Дууг 0–1 хооронд тохируулна (0 бол чимээгүй). iOS Safari видеоны дууг JS-ээр өөрчлөх боломжгүй (төхөөрөмжийн товчоор).
  const changeVolume = (x: number) => {
    const v = videoRef.current;
    if (!v) return;
    const n = Math.max(0, Math.min(1, x));
    v.volume = n;
    v.muted = n === 0;
    setVolume(n);
    setMuted(n === 0);
    try { localStorage.setItem("km:vol", String(n)); } catch {}
    wake();
  };

  // Видеоны native fullscreen нь зөвхөн <video>-г томруулж watermark-г алдагдуулдаг тул
  // watermark-тай хамт container-ийг бүтэн дэлгэц болгоно.
  const toggleFullscreen = () => {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else if (box.requestFullscreen) box.requestFullscreen().catch(() => {});
    else (videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null)?.webkitEnterFullscreen?.(); // iOS Safari (watermark харагдахгүй)
  };

  // Бүтэн дэлгэцэд орохдоо утсыг хэвтээ болгоно
  useEffect(() => {
    const onFs = () => {
      const on = !!document.fullscreenElement;
      setFs(on);
      const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      try {
        if (on) so.lock?.("landscape").catch(() => {});
        else so.unlock?.();
      } catch {}
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Сүүлд тохируулсан дууг сэргээнэ
  useEffect(() => {
    const v = videoRef.current;
    if (!isFile || !v) return;
    // Утас/таблет дээр дууг төхөөрөмжийн товч (hardware) удирдана: видеоны дууг 100% дээр үлдээнэ
    if (window.matchMedia("(pointer: coarse)").matches) {
      v.volume = 1;
      return;
    }
    try {
      const saved = localStorage.getItem("km:vol");
      if (saved !== null) {
        const n = Math.max(0, Math.min(1, Number(saved)));
        v.volume = n;
        setVolume(n);
        if (n === 0) { v.muted = true; setMuted(true); }
      }
    } catch {}
  }, [isFile]);

  // Видеоны үйл явдлуудыг төлөвт холбоно
  useEffect(() => {
    const v = videoRef.current;
    if (!isFile || !v) return;
    const on = {
      play: () => { setPlaying(true); wake(); },
      pause: () => { setPlaying(false); setShowUI(true); },
      timeupdate: () => setCur(v.currentTime),
      durationchange: () => setDur(v.duration || 0),
      loadedmetadata: () => {
        setDur(v.duration || 0);
        if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
      },
      waiting: () => setBuffering(true),
      playing: () => setBuffering(false),
      canplay: () => setBuffering(false),
    } as const;
    Object.entries(on).forEach(([e, f]) => v.addEventListener(e, f));
    return () => Object.entries(on).forEach(([e, f]) => v.removeEventListener(e, f));
  }, [isFile, wake]);

  // Хуруугаар хоёр товшоход ±10 сек, нэг товшоход удирдлага харуулах/нуух
  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const side: "l" | "r" | "c" = x < 0.35 ? "l" : x > 0.65 ? "r" : "c";
    const now = Date.now();
    if (now - lastTap.current.t < 300 && side !== "c" && side === lastTap.current.side) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      seekBy(side === "l" ? -10 : 10);
      setFlash({ side, n: Date.now() });
      setTimeout(() => setFlash(null), 600);
      lastTap.current = { t: 0, side: "c" };
      return;
    }
    lastTap.current = { t: now, side };
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (side === "c") togglePlay();
      else if (showUI && playing) setShowUI(false);
      else wake();
    }, 300);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); togglePlay(); }
    else if (k === "arrowleft" || k === "j") seekBy(-10);
    else if (k === "arrowright" || k === "l") seekBy(10);
    else if (k === "m") toggleMute();
    else if (k === "arrowup") { e.preventDefault(); changeVolume((videoRef.current?.volume ?? volume) + 0.1); }
    else if (k === "arrowdown") { e.preventDefault(); changeVolume((videoRef.current?.volume ?? volume) - 0.1); }
    else if (k === "f") toggleFullscreen();
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

  const btn = "p-2 rounded-full text-white hover:bg-white/15 active:bg-white/25 transition-colors";

  return (
    <div className="glass-container p-4 lg:p-6 select-none">
      <style>{`@media print { .protected-player { display: none !important; } }`}</style>
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">{title} үзэх</h2>
      <div
        ref={boxRef}
        tabIndex={0}
        onKeyDown={isFile ? onKey : undefined}
        onMouseMove={isFile ? wake : undefined}
        // Видео өөрийн харьцаагаараа харагдана (хар зайгүй); босоо видео дэлгэцээс хэтрэхгүй (80vh). Fullscreen-д дэлгэцийг дүүргэнэ.
        style={isFile && !fs ? { aspectRatio: String(ratio), maxWidth: `calc(80vh * ${ratio})` } : undefined}
        className={`protected-player relative w-full mx-auto rounded-xl overflow-hidden bg-black outline-none ${isFile ? "" : "aspect-video"}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {isFile ? (
          <>
            <video
              ref={videoRef}
              src={url}
              poster={poster ?? undefined}
              playsInline
              controlsList="nodownload noremoteplayback nofullscreen"
              disablePictureInPicture
              disableRemotePlayback
              className="absolute inset-0 w-full h-full"
            />

            {/* Товшилтын давхарга: 2 товшилт = ±10 сек, төвд товшвол тоглуулах/зогсоох */}
            <div className="absolute inset-0 z-10" onClick={onTap} />

            {wmText && <Watermark text={wmText} onTamper={onTamper} />}

            {flash && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none rounded-full bg-black/60 px-4 py-3 text-white text-sm font-semibold ${
                  flash.side === "l" ? "left-[12%]" : "right-[12%]"
                }`}
              >
                {flash.side === "l" ? "⏪ 10 сек" : "10 сек ⏩"}
              </div>
            )}

            {buffering && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
            )}

            {/* Удирдлага */}
            <div
              className={`absolute inset-x-0 bottom-0 z-30 transition-opacity duration-300 ${
                showUI ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="bg-gradient-to-t from-black/85 to-transparent px-2 pt-8 pb-1 sm:px-3">
                <input
                  type="range"
                  min={0}
                  max={dur || 0}
                  step={1}
                  value={cur}
                  onChange={(e) => {
                    const v = videoRef.current;
                    if (v) v.currentTime = Number(e.target.value);
                    setCur(Number(e.target.value));
                    wake();
                  }}
                  aria-label="Хугацаа"
                  className="w-full h-1 accent-yellow-400 cursor-pointer"
                />
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button type="button" onClick={togglePlay} aria-label={playing ? "Зогсоох" : "Тоглуулах"} className={btn}>
                    {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                  </button>
                  <button type="button" onClick={() => seekBy(-10)} aria-label="10 сек ухраах" className={btn}>
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => seekBy(10)} aria-label="10 сек урагшлуулах" className={btn}>
                    <RotateCw className="h-5 w-5" />
                  </button>
                  <span className="ml-1 text-xs text-white tabular-nums">
                    {fmt(cur)} / {fmt(dur)}
                  </span>
                  <span className="flex-1" />
                  <button type="button" onClick={cycleSpeed} aria-label="Хурд" className={`${btn} text-xs font-bold min-w-[44px]`}>
                    {speed}x
                  </button>
                  {/* Дуу: компьютер дээр mute + slider; утсан дээр зөвхөн mute (дууг утасны товч удирдана) */}
                  <div className="relative flex items-center">
                    <button type="button" onClick={toggleMute} aria-label="Дуу хаах/нээх" className={btn}>
                      {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => changeVolume(Number(e.target.value))}
                      aria-label="Дууны түвшин"
                      className="hidden sm:block [@media(pointer:coarse)]:hidden w-20 h-1 accent-yellow-400 cursor-pointer"
                    />
                  </div>
                  <button type="button" onClick={toggleFullscreen} aria-label="Бүтэн дэлгэц" className={btn}>
                    {fs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Зогссон үед голд том тоглуулах товч */}
            {!playing && !buffering && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Тоглуулах"
                className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-5 text-white backdrop-blur-sm active:scale-95 transition-transform"
              >
                <Play className="h-9 w-9 fill-current" />
              </button>
            )}

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

      {/* Embed (iframe) линк: видео энд нээгдэхгүй/удаан байвал шууд линк рүү нь орж үзнэ.
          Файл (mp4/m3u8) үед хамгаалалт (watermark) алгасагдахгүйн тулд харуулахгүй. */}
      {!isFile && /^https?:\/\//i.test(url) && (
        <div className="mt-3 space-y-1 text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-theme-primary py-3 font-semibold text-black active:scale-[0.98] transition-transform"
          >
            <ExternalLink className="h-5 w-5" /> Шууд линкээр үзэх
          </a>
          <p className="text-xs text-gray-400">Видео дээр нээгдэхгүй бол энэ товчийг дарж шинэ цонхонд үзнэ үү.</p>
        </div>
      )}
    </div>
  );
}
