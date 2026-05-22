import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const transactionId = String(body.transaction_id || body.trx_id || "").trim();
    const senderNumber = String(body.sender_number || "").trim();
    const paymentMethod = String(body.payment_method || body.method || "").trim();
    const planId = String(body.plan_id || "").trim();
    const selectedBatchId = String(body.batch_id || "").trim();
    const amount = Number(body.amount);

    if (!paymentMethod) return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    if (!transactionId) return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    if (!senderNumber) return NextResponse.json({ error: "Sender number is required" }, { status: 400 });
    if (!planId) return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    if (!selectedBatchId) return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });

    const cleanSenderNumber = String(body.sender_number || "").replace(/[\s-]/g, "").replace(/^(\+88|88)/, "");
    const phoneRegex = /^(01)[3-9][0-9]{8}$/;
    if (!phoneRegex.test(cleanSenderNumber)) {
      return NextResponse.json({ error: "Invalid sender number format. Use 11 digits (e.g. 01XXXXXXXXX)" }, { status: 400 });
    }

    const db = createAdminClient();
    
    // 1. Insert manual payment request
    const { data: payment, error: paymentError } = await db
      .from("manual_payment_requests")
      .insert({
        user_id: user.id,
        plan_id: planId,
        batch_id: selectedBatchId,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        sender_number: cleanSenderNumber,
        amount: amount,
        status: "pending"
      })
      .select()
      .single();

    if (paymentError) {
      if (paymentError.code === "23505") return NextResponse.json({ error: "Transaction ID already exists" }, { status: 409 });
      throw paymentError;
    }

    // 2. Manual Upsert subscription with pending_payment status
    const { data: existingSubscription } = await db
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subPayload = {
      user_id: user.id,
      plan_id: planId,
      batch_id: selectedBatchId,
      status: "pending_payment",
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

    if (subError) throw subError;

    // 2.5 Insert Notification for student
    await db.from("notifications").insert({
      user_id: user.id,
      title: "Payment Submitted",
      message: "Your payment is waiting for admin approval.",
      type: "payment_pending"
    });

    // 3. Keep legacy batch_subscriptions in sync for now
    const { data: existingSub } = await db
      .from("batch_subscriptions")
      .select("id")
      .eq("student_id", user.id)
      .eq("batch_id", selectedBatchId)
      .eq("status", "pending_payment")
      .maybeSingle();

    const legacyPayload = {
      student_id: user.id,
      batch_id: selectedBatchId,
      amount_paid: amount,
      payment_id: `MANUAL-${transactionId}`,
      status: "pending_payment",
      subscription_type: body.subscription_type || "batch",
      phase: body.phase || "full",
      course_id: body.course_id || null,
    };

    if (existingSub) {
      await db.from("batch_subscriptions").update(legacyPayload).eq("id", existingSub.id);
    } else {
      await db.from("batch_subscriptions").insert(legacyPayload);
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (err: any) {
    console.error("manual payment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment submission failed" },
      { status: 500 }
    );
  }
}
