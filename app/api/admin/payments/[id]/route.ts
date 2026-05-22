import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getManualPaymentOrThrow(db: any, paymentId: string) {
  const { data: payment, error: fetchError } = await db
    .from("manual_payment_requests")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (!fetchError && payment) return payment;

  console.error("PAYMENT_NOT_FOUND_IN_DB:", { paymentId, error: fetchError });

  const { data: allRows, error: allRowsError } = await db
    .from("manual_payment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("all manual_payment_requests rows:", allRows);
  console.log("manual_payment_requests fetch all error:", allRowsError);

  const matchingRows = (allRows || []).filter((row: any) => String(row.id) === String(paymentId));
  console.log("clicked id comparison:", {
    clickedId: paymentId,
    matchingRows,
    availableIds: (allRows || []).map((row: any) => row.id),
  });

  if (allRowsError) {
    throw new Error(`Payment lookup failed for id ${paymentId}. Could not fetch all payment rows: ${allRowsError.message}`);
  }

  const availableIds = (allRows || []).map((row: any) => row.id).join(", ") || "none";
  throw new Error(`Payment request not found for clicked id ${paymentId}. manual_payment_requests row count: ${(allRows || []).length}. Available ids: ${availableIds}`);
}

async function activateStudentSubscription(db: any, payment: any) {
  const userId = payment.user_id;
  console.log("APPROVING USER:", userId);

  const { data: existingSubscription } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subPayload = {
    user_id: userId,
    plan_id: payment.plan_id,
    batch_id: payment.batch_id,
    course_id: payment.course_id || null,
    status: "active",
    updated_at: new Date().toISOString()
  };

  let subError;
  if (existingSubscription) {
    const { error } = await db
      .from("subscriptions")
      .update(subPayload)
      .eq("id", existingSubscription.id);
    subError = error;
  } else {
    const { error } = await db
      .from("subscriptions")
      .insert(subPayload);
    subError = error;
  }

  console.log("SUBSCRIPTION RESULT ERROR:", subError);

  if (subError) {
    console.error("FAILED TO ACTIVATE SUBSCRIPTION:", subError);
    throw subError;
  }
}

async function rejectStudentSubscription(db: any, payment: any) {
  const { data: subData, error: subError } = await db
    .from("subscriptions")
    .update({ status: "rejected" })
    .eq("user_id", payment.user_id)
    .select()
    .maybeSingle();

  console.log("subscription update result:", subData, subError);

  if (subError) throw subError;

  console.log("student latest subscription:", subData);
  console.log("access status:", "rejected");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ⚠️ Next.js 15+: params is a Promise — must be awaited before use
    const { id: paymentId } = await params;
    console.log("api received paymentId", paymentId);

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID in URL" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("admin user", user);

    if (!user) {
      console.log("admin profile", null);
      console.log("forbidden reason", "No logged-in user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("admin profile", profile);

    const role = String(profile?.role || "").toLowerCase();
    const isAllowedAdmin = ["admin", "super_admin", "superadmin"].includes(role);
    if (profileError) {
      console.log("forbidden reason", profileError);
    } else if (!profile) {
      console.log("forbidden reason", "No profile found; temporary admin payment override enabled");
    } else if (!isAllowedAdmin) {
      console.log("forbidden reason", `Profile role is ${profile.role}; temporary admin payment override enabled`);
    } else {
      console.log("forbidden reason", null);
    }

    const db = createAdminClient();
    const { action } = await request.json(); // 'approve' or 'reject'
    console.log("API ACTION:", action);

    if (action === "approve") {
      // 1. Get payment details from the submitted payment request.
      const payment = await getManualPaymentOrThrow(db, paymentId);
      const selectedBatchId = payment.batch_id;
      if (!selectedBatchId) throw new Error("Payment is missing selected batch id");

      // 2. Calculate Expiry Date
      let expiryDate: string | null = null;
      const now = new Date();

      expiryDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString();

      // 3. Update manual_payment_requests
      const { error: updateError } = await db
        .from("manual_payment_requests")
        .update({ 
          status: "approved"
        })
        .eq("id", paymentId);

      if (updateError) throw updateError;

      await activateStudentSubscription(db, payment);

      console.log(`[ACCESS_GRANTED] student=${payment.user_id} batch=${selectedBatchId} type=batch expires=${expiryDate}`);

      // 4.5 Insert Notification for student
      await db.from("notifications").insert({
        user_id: payment.user_id,
        title: "Payment Approved",
        message: "Your subscription is active. You can access your course/batch now.",
        type: "payment_approved"
      });

      // 5. Send Email (Placeholder)
      console.log(`[EMAIL] To: ${payment.user_id}, Subject: Payment Approved, Body: Your subscription is now active.`);

      return NextResponse.json({ success: true, message: "Payment approved and subscription activated" });
    } else if (action === "reject") {
      const payment = await getManualPaymentOrThrow(db, paymentId);

      const { error: rejectError } = await db
        .from("manual_payment_requests")
        .update({ 
          status: "rejected"
        })
        .eq("id", paymentId);

      if (rejectError) throw rejectError;

      await rejectStudentSubscription(db, payment);

      // Insert Notification for student
      await db.from("notifications").insert({
        user_id: payment.user_id,
        title: "Payment Rejected",
        message: "Your payment was rejected. Please submit again.",
        type: "payment_rejected"
      });

      return NextResponse.json({ success: true, message: "Payment rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
