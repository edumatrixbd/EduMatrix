import { createClient } from "@/lib/supabase/server";
import { getLatestSubscriptionAccess } from "@/lib/paid-access";

export type AccessTarget = {
  university_id: string;
  department_id: string;
  batch_id: string;
  course_id: string;
  semester: number;
  category: 'mid' | 'final' | string;
};

export async function checkAccess(userId: string, target: AccessTarget): Promise<{ hasAccess: boolean; reason?: string }> {
  const supabase = await createClient();

  // 1. Check user role first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile && ['admin', 'super_admin', 'instructor'].includes(profile.role)) {
    return { hasAccess: true };
  }

  const { status } = await getLatestSubscriptionAccess(supabase, userId);

  if (status === "active") {
    return { hasAccess: true };
  }

  if (status === "pending_payment") {
    return {
      hasAccess: false,
      reason: "Your payment is waiting for admin approval. Access will unlock after approval.",
    };
  }

  return { hasAccess: false, reason: "No active subscription found" };
}
