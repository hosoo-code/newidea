// Нэвтрэлтийн оролдлогын хязгаар. Утгыг эндээс өөрчилнө.
// ⚠️ IP-ийн хязгаарыг хэт багасгаж болохгүй: Монголын мобайл сүлжээнд олон хэрэглэгч нэг IP хуваалцдаг.
export const AUTH_LIMITS = {
  loginPerPhone: { max: 3, windowSec: 45 }, // нэг дугаарт 45 секундэд 3 оролдлого
  loginPerIp: { max: 30, windowSec: 15 * 60 },
  registerPerIp: { max: 5, windowSec: 60 * 60 },
  pinChangePerUser: { max: 3, windowSec: 45 },
} as const;

// "N секундийн дараа дахин оролдоно уу" мэдэгдэлд
export const waitText = (sec: number) => (sec >= 120 ? `${Math.round(sec / 60)} минутын` : `${sec} секундын`);
