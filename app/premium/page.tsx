import { getCurrentProfile, isPremium } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import PremiumClient from "@/components/premium/PremiumClient";
import MediaDetailLayout from "@/components/layout/MediaDetailLayout";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Premium | Kino Mangas" };

export default async function PremiumPage() {
  const profile = await getCurrentProfile();
  const active = isPremium(profile);
  const plans = Object.entries(PLANS).map(([id, p]) => ({ id, label: p.label, amount: p.amount }));

  return (
    <MediaDetailLayout className="pt-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Kino Mangas Premium</h1>
        <p className="text-gray-300 text-center">Манай сангийн бүх киног хязгааргүй үзээрэй.</p>

        {!profile ? (
          <div className="glass-container p-6 text-center space-y-3">
            <p className="text-gray-300">Premium авахын тулд эхлээд нэвтэрнэ үү.</p>
            <Link href="/login?next=/premium" className="inline-block rounded-lg bg-theme-primary text-black font-semibold px-5 py-2">
              Нэвтрэх
            </Link>
          </div>
        ) : (
          <>
            {active && (
              <p className="text-center text-green-400">
                {profile.role === "admin"
                  ? "Та admin тул бүх контентод эрхтэй."
                  : `Premium идэвхтэй – ${new Date(profile.premium_until!).toLocaleDateString("mn-MN")} хүртэл. Сунгавал үлдсэн хоног дээр нэмэгдэнэ.`}
              </p>
            )}
            <PremiumClient plans={plans} />
          </>
        )}
      </div>
    </MediaDetailLayout>
  );
}
