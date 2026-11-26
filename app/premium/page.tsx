import { getCurrentProfile, isPremium } from "@/lib/auth";
import { getPlans } from "@/lib/plans";
import { daysLeft, formatDate } from "@/lib/format";
import PremiumClient from "@/components/premium/PremiumClient";
import CopyId from "@/components/premium/CopyId";
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
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">Kino Mangas Premium</h1>
        <p className="text-gray-300 text-center text-sm sm:text-base">Манай сангийн бүх киног хязгааргүй үзээрэй.</p>

        {!profile ? (
          <div className="glass-container text-center space-y-3">
            <p className="text-gray-300">Premium авахын тулд эхлээд нэвтэрнэ үү.</p>
            <Link href="/login?next=/premium" className="inline-block rounded-lg bg-theme-primary text-black font-semibold px-5 py-2">
              Нэвтрэх
            </Link>
          </div>
        ) : (
          <>
            {/* Профайл */}
            <section className="glass-container space-y-4" aria-label="Профайл">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-white font-semibold">Профайл</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isAdmin
                      ? "bg-yellow-400/20 text-yellow-300"
                      : active
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700/60 text-gray-300"
                  }`}
                >
                  {isAdmin ? "Admin" : active ? "Premium" : "Үнэгүй"}
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-gray-400">Имэйл</dt>
                  <dd className="text-white break-all">{profile.email ?? "—"}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-gray-400">ID</dt>
                  <dd className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 text-xs text-white break-all">{profile.id}</code>
                    <CopyId value={profile.id} />
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-gray-400">Premium дуусах огноо</dt>
                  <dd className="text-white">
                    {isAdmin ? (
                      "Хугацаагүй (admin)"
                    ) : until ? (
                      <>
                        {formatDate(until)}
                        <span className={`ml-2 ${active ? "text-green-400" : "text-red-400"}`}>
                          {active ? `(${daysLeft(until)} хоног үлдсэн)` : "(дууссан)"}
                        </span>
                      </>
                    ) : (
                      "Premium идэвхжээгүй"
                    )}
                  </dd>
                </div>
              </dl>

              {active && !isAdmin && (
                <p className="text-xs text-gray-400">Сунгавал үлдсэн хоног дээр нэмэгдэнэ.</p>
              )}
            </section>

            {plans.length > 0 ? (
              <PremiumClient plans={plans.map(({ id, label, amount, days }) => ({ id, label, amount, days }))} />
            ) : (
              <p className="text-center text-gray-400">Одоогоор худалдаалагдаж буй багц алга.</p>
            )}
          </>
        )}
      </div>
    </MediaDetailLayout>
  );
}
