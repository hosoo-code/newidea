"use client";
import { useEffect, useRef, useState } from "react";

// ⚠️ Эдгээр нь зөвхөн саад (deterrent). Утасны камер, гадны төхөөрөмж, зарим screen recorder-ийг
// браузераас бүрэн хориглох боломжгүй. Бодит хамгаалалт = DRM (Widevine/FairPlay).
export default function LocalPlayer({ url, title, poster, movieId }: { url: string; title: string; poster?: string | null; movieId?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shield, setShield] = useState(false);
  const isFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url.split("?")[0]) || /\.m3u8/i.test(url);

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
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              className="absolute inset-0 w-full h-full"
            />
            {shield && (
              <div className="absolute inset-0 bg-black flex items-center justify-center text-gray-300 text-sm z-10">
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
