// Огноог Улаанбаатарын цагаар YYYY-MM-DD болгоно (server/client-д ижил, ICU-ээс хамаарахгүй).
export const formatDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso)
  );

export const daysLeft = (iso: string | Date) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
