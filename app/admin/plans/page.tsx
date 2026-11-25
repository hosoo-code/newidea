import Link from "next/link";
import { getPlans } from "@/lib/plans";
import PlansForm from "@/components/admin/PlansForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Premium багцууд | Admin", robots: { index: false } };

export default async function AdminPlansPage() {
  const plans = await getPlans({ includeInactive: true });
  return (
    <div className="app-bg-enhanced min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">Premium багцууд</h1>
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Кинонууд</Link>
        </div>
        <PlansForm initial={plans} />
      </div>
    </div>
  );
}
