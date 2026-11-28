import { getCurrentProfile, isPremium } from "@/lib/auth";
import { getPlans } from "@/lib/plans";
import { formatDate, daysLeft } from "@/lib/format";
import PremiumClient from "@/components/premium/PremiumClient";
import PaymentHistory from "@/components/premium/PaymentHistory";
import MediaDetailLayout from "@/components/layout/MediaDetailLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Premium | Kino Mangas" };

export default async function PremiumPage() {
  const [profile, plans] = await Promise.all([getCurrentProfile(), getPlans()]);
  const active = isPremium(profile);
  const isAdmin = profile?.role === "admin";
  const until = profile?.premium_until ?? null;

  return (
    <MediaDetailLayout className="pt-16">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/15 via-gray-900/60 to-red-600/10 px-6 py-10 text-center">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-theme-primary/20 blur-3xl" />
          <span className="relative inline-block rounded-full border border-theme-primary/40 bg-theme-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-theme-primary">
            ★ PREMIUM
          </span>
          <h1 className="relative mt-4 text-3xl sm:text-4xl font-extrabold text-white">Kino Mangas Premium</h1>
          <p className="relative mt-2 text-gray-300 text-sm sm:text-base">Манай сангийн бүх киног хязгааргүй үзээрэй.</p>
        </header>

        {!profile ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 text-center space-y-4">
            <p className="text-gray-300">Premium авахын тулд эхлээд нэвтэрнэ үү.</p>
            <Link href="/login?next=/premium" className="inline-block rounded-xl bg-theme-primary text-black font-bold px-6 py-2.5 active:scale-95 transition-all">
              Нэвтрэх
            </Link>
          </div>
        ) : (
          <>
            {/* Миний эрх */}
            <section aria-label="Миний эрх" className="flex items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-900/50 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Нэвтэрсэн</p>
                <p className="truncate text-white font-medium">{profile.email ?? "—"}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {isAdmin
                    ? "Хугацаагүй эрх (admin)"
                    : until
                      ? `${active ? "Дуусах огноо" : "Дууссан"}: ${formatDate(until)}${active ? ` (${daysLeft(until)} хоног үлдсэн)` : ""}`
                      : "Premium идэвхжээгүй"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${
                  isAdmin
                    ? "bg-yellow-400/20 text-yellow-300"
                    : active
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700/60 text-gray-300"
                }`}
              >
                {isAdmin ? "Admin" : active ? "Premium ✓" : "Үнэгүй"}
              </span>
            </section>

            {active && !isAdmin && <p className="-mt-4 text-center text-xs text-gray-400">Сунгавал одоогийн хугацаан дээр нэмэгдэнэ.</p>}

            {plans.length > 0 ? (
              <PremiumClient plans={plans.map(({ id, label, amount, days }) => ({ id, label, amount, days }))} />
            ) : (
              <p className="text-center text-gray-400">Одоогоор худалдаалагдаж буй багц алга.</p>
            )}

            <PaymentHistory />
          </>
        )}
      </div>
    </MediaDetailLayout>
  );
}
