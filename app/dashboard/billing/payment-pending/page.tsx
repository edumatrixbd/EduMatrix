"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getLatestSubscriptionAccess } from "@/lib/paid-access";
import { useAuth } from "@/hooks/use-auth";

export default function PaymentPendingPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  useEffect(() => {
    const redirectIfApproved = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { hasAccess } = await getLatestSubscriptionAccess(supabase, user.id);
 
      if (hasAccess) {
        await refresh();
        router.replace("/dashboard");
      }
    };

    redirectIfApproved();
  }, [refresh, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <Clock className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">
            Payment submitted. Waiting for admin approval.
          </h1>
          <p className="text-sm font-medium text-slate-500">
            You will get access after the payment is verified.
          </p>
        </div>
        <Button asChild className="rounded-xl font-bold">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
