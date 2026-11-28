// Нэвтрэлтийн оролдлогын хязгаар. Утгыг эндээс өөрчилнө.
// ⚠️ IP-ийн хязгаарыг хэт багасгаж болохгүй: Монголын мобайл сүлжээнд олон хэрэглэгч нэг IP хуваалцдаг.
export const AUTH_LIMITS = {
  loginPerPhone: { max: 3, windowSec: 15 * 60 }, // нэг дугаарт 15 минутанд 3 оролдлого (4 оронтой PIN-ийг таахаас хамгаална)
  loginPerIp: { max: 30, windowSec: 15 * 60 },
  registerPerIp: { max: 5, windowSec: 60 * 60 },
  pinChangePerUser: { max: 3, windowSec: 15 * 60 },
} as const;
