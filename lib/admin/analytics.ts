"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTopPerformingCourses(instructorId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_top_performing_courses", {
    p_instructor_id: instructorId
  });

  if (error) {
    console.error("Error fetching top performing courses:", error);
    return [];
  }

  return data;
}

export async function getDropOffAlerts(instructorId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_drop_off_alerts", {
    p_instructor_id: instructorId
  });

  if (error) {
    console.error("Error fetching drop-off alerts:", error);
    return [];
  }

  return data;
}

export async function getEngagementWarnings(instructorId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_engagement_warnings", {
    p_instructor_id: instructorId
  });

  if (error) {
    console.error("Error fetching engagement warnings:", error);
    return [];
  }

  return data;
}

export async function getPlatformOverview() {
  const supabase = await createClient();
  
  const [
    { count: totalStudents },
    { count: totalCourses },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("manual_payment_requests").select("amount").eq("status", "approved")
  ]);

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  return {
    totalStudents: totalStudents || 0,
    totalCourses: totalCourses || 0,
    totalRevenue
  };
}

export async function getAdminActionableInsights() {
  const supabase = await createClient();
  const [
    { count: pendingPayments },
    { count: unreadFeedback },
    { count: rejectedPayments },
    { count: inactiveCourses }
  ] = await Promise.all([
    supabase.from("manual_payment_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("material_feedback").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("manual_payment_requests").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("active", false),
  ]);

  return {
    pendingPayments: pendingPayments || 0,
    unreadFeedback: unreadFeedback || 0,
    rejectedPayments: rejectedPayments || 0,
    inactiveCourses: inactiveCourses || 0
  };
}
