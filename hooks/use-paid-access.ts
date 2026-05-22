"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLatestSubscriptionAccess, PaidAccessStatus } from "@/lib/paid-access";

export function usePaidAccess() {
  const [subscription, setSubscription] = useState<any | null>(null);
  const [status, setStatus] = useState<PaidAccessStatus>("no_subscription");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log("latest subscription:", null);
        console.log("access status:", undefined);
        setSubscription(null);
        setStatus("no_subscription");
        return;
      }

      const access = await getLatestSubscriptionAccess(supabase, user.id);
      setSubscription(access.subscription);
      setStatus(access.status);
      setError(null);
    } catch (err) {
      console.log("paid access error:", err);
      setError(err);
      setSubscription(null);
      setStatus("no_subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    subscription,
    status,
    loading,
    error,
    hasAccess: status === "active",
    isPending: status === "pending_payment",
    shouldUpgrade: status === "no_subscription",
    refetch,
  };
}
