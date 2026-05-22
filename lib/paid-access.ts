export type PaidAccessStatus = "active" | "pending_payment" | "no_subscription" | string;

export async function getLatestSubscriptionAccess(supabase: any, userId: string) {
  // 1. Fetch latest subscription
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // Using maybeSingle to avoid 406 error if no row exists

  console.log("subscription", subscription);
  const { data: payment, error: payError } = await supabase
    .from("manual_payment_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log("subscription", subscription);
  console.log("latest payment", payment);

  if (subError && subError.code !== "PGRST205" && subError.code !== "42P01") {
    console.warn("Paid Access Helper: Subscription fetch error:", subError);
  }

  const isSubActive = subscription?.status === "active";
  const isSubPending = subscription?.status === "pending_payment";
  const isSubRejected = subscription?.status === "rejected";
  const isPaymentPending = payment?.status === "pending";

  const isPending = isSubPending || isPaymentPending;
  const hasAccess = isSubActive;
  const shouldUpgrade = !hasAccess && !isPending;

  let status: PaidAccessStatus = "no_subscription";
  if (isSubActive) status = "active";
  else if (isPending) status = "pending_payment";
  else if (isSubRejected) status = "rejected";

  return {
    subscription,
    latestPayment: payment,
    status,
    hasAccess,
    isPending,
    isRejected: isSubRejected,
    shouldUpgrade,
  };
}
