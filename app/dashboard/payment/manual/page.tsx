"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Copy, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck,
  Smartphone,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PAYMENT_LOGOS: Record<string, string> = {
  bkash: "/payment/bkash.png",
  nagad: "/payment/nagad.png",
  rocket: "/payment/rocket.png",
  upay: "/payment/upay.png",
};

const FALLBACK_PAYMENT_METHODS = [
  { id: "fallback-bkash", name: "bkash", number: "01977967580", active: true },
  { id: "fallback-nagad", name: "nagad", number: "01352467585", active: true },
  { id: "fallback-rocket", name: "rocket", number: "01842230442", active: true },
  { id: "fallback-upay", name: "upay", number: "01842230442", active: true },
];

export default function ManualPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("plan_id") || searchParams.get("plan");
  const batchId = searchParams.get("batch_id") || searchParams.get("batch");
  const universityId = searchParams.get("university_id");
  const departmentId = searchParams.get("department_id");
  const amountParam = searchParams.get("amount");
  const subscriptionType = searchParams.get("subscription_type") || "batch";
  const phase = searchParams.get("phase") || "full";
  const courseId = searchParams.get("course_id");
  const semester = searchParams.get("semester");
  
  const [dbMethods, setDbMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [resolvedBatchId, setResolvedBatchId] = useState<string | null>(batchId);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [courseInfo, setCourseInfo] = useState<any>(null);

  const selectedMethodInfo = dbMethods.find(m => m.name === selectedMethod);
  const displayMobileNumber = selectedMethodInfo?.number || "N/A";
  const formatPaymentMethodName = (method: any) =>
    method?.display_name || (method?.name === "bkash" ? "bKash" : method?.name?.charAt(0).toUpperCase() + method?.name?.slice(1));
  const amount = amountParam || String(planInfo?.price || "2500");

  useEffect(() => {
    fetchData();
  }, [planId, batchId, courseId]);

  const fetchData = async () => {
    setPageLoading(true);
    setPageError(null);

    const supabase = createClient();
    console.log("planId", planId);
    console.log("batchId", batchId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let profile = null;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, batch_id, university_id, department_id")
          .eq("id", user.id)
          .maybeSingle();

        profile = profileData;
        console.log("profile", profile);
        if (profileError) console.log("error", profileError);
      } else {
        console.log("profile", null);
      }

      if (!planId) {
        const error = new Error("Missing selected plan. Please choose a plan again.");
        console.log("plan", null);
        console.log("error", error);
        throw error;
      }

      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      console.log("plan", plan);
      console.log("error", planError);

      if (planError) throw planError;
      if (!plan) throw new Error("Selected plan was not found. Please choose a plan again.");
      setPlanInfo(plan);

      const selectedBatchId = batchId || profile?.batch_id || null;
      setResolvedBatchId(selectedBatchId);

      if (!selectedBatchId) {
        throw new Error("Missing selected batch. Please select your batch before payment.");
      }

      const { data: methods, error: methodsError } = await supabase
        .from("payment_methods")
        .select("name, number, active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (methodsError) {
        console.log("error", methodsError);
        setDbMethods(FALLBACK_PAYMENT_METHODS);
      } else if (!methods || methods.length === 0) {
        setDbMethods(FALLBACK_PAYMENT_METHODS);
      } else {
        setDbMethods(methods);
      }

      const { data: batch, error: batchError } = await supabase
        .from("academic_batches")
        .select("*")
        .eq("id", selectedBatchId)
        .maybeSingle();

      if (batchError) {
        console.log("error", batchError);
        throw batchError;
      }
      console.log("BATCH_INFO_FETCHED:", batch);
      setBatchInfo(batch || {});

      if (courseId) {
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .maybeSingle();

        if (courseError) console.log("error", courseError);
        setCourseInfo(course);
      }
    } catch (error: any) {
      console.log("error", error);
      setPageError(error.message || "Could not load payment information.");
    } finally {
      setPageLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!displayMobileNumber || displayMobileNumber === 'N/A') return;
    navigator.clipboard.writeText(displayMobileNumber);
    setCopied(true);
    toast.success(`${formatPaymentMethodName(selectedMethodInfo) || 'Number'} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("confirm clicked");

    try {
      if (!trxId.trim()) {
        throw new Error("Please enter the transaction ID");
      }
      if (!senderNumber.trim()) {
        throw new Error("Please enter the sender number");
      }
      if (!selectedMethod) {
        throw new Error("Please select a payment method");
      }
      if (!planId) {
        throw new Error("Missing selected plan. Please choose a plan again.");
      }
      if (!resolvedBatchId) {
        throw new Error("Missing selected batch. Please choose a batch again.");
      }

      // Sanitize: remove spaces, dashes, and +88/88 prefixes
      let cleanSenderNumber = senderNumber.replace(/[\s-]/g, "").replace(/^(\+88|88)/, "");
      
      if (!cleanSenderNumber.match(/^(01)[3-9][0-9]{8}$/)) {
        throw new Error("Invalid sender number format. Use 11 digits (e.g., 01XXXXXXXXX)");
      }

      setSubmitting(true);
      const payload = {
        transaction_id: trxId.trim(),
        sender_number: cleanSenderNumber,
        payment_method: selectedMethod,
        amount: parseFloat(amount),
        plan_id: planId,
        batch_id: resolvedBatchId,
        university_id: universityId,
        department_id: departmentId,
        subscription_type: subscriptionType,
        phase: phase,
        course_id: courseId || null,
        semester: semester ? parseInt(semester) : null,
      };

      console.log("MANUAL_PAYMENT_SUBMITTING:", payload);

      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log("payment response", res.status, data);

      if (!res.ok) {
        console.error("Payment Submission Failed:", data);
        throw new Error(data.error || "Failed to submit payment");
      }

      toast.success("Payment submitted successfully!");
      
      // Delay slightly to let toast be seen before redirect
      setTimeout(() => {
        router.push("/dashboard/billing/payment-pending");
      }, 1000);

    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error(error.message || "An unexpected error occurred");
      // Ensure submitting is false so button unlocks
      setSubmitting(false);
    } finally {
      // Note: we don't setSubmitting(false) here if successful to prevent button flicker during redirect
      // But we handled it in catch above.
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 min-h-screen">
        <Card className="border-red-100 bg-white shadow-xl">
          <CardContent className="p-8 space-y-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h1 className="text-2xl font-black text-slate-900">Payment setup error</h1>
            <p className="text-sm font-bold text-slate-500">{pageError}</p>
            <Button asChild className="rounded-xl font-bold">
              <Link href="/dashboard/billing">Back to Billing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 min-h-screen bg-slate-50/50">
      <Link href="/dashboard/billing">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 -ml-4 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Plans
        </Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Payment</h1>
        <p className="text-slate-500 font-medium">
          Complete your {subscriptionType} ({phase}) subscription for S{semester}
          {courseInfo ? ` for ${courseInfo.course_name}` : ` for Batch ${batchInfo.batch_number}`}
        </p>
      </motion.div>

      <Card className="border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden opacity-100">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Select Payment Method</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {dbMethods.map((method) => {
              const isSelected = selectedMethod === method.name;
              const logoPath = PAYMENT_LOGOS[method.name.toLowerCase()] || method.logo_url;

              return (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.name)}
                  className={cn(
                    "relative group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-500",
                    isSelected 
                      ? "bg-white border-primary shadow-[0_0_25px_-5px_rgba(255,176,15,0.4)] z-10" 
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="w-14 h-10 relative flex items-center justify-center">
                    {logoPath ? (
                      <img 
                        src={logoPath} 
                        alt={method.name} 
                        className="w-14 h-10 object-contain mx-auto opacity-100 grayscale-0 transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {method.name}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                    isSelected ? "text-slate-900" : "text-slate-400"
                  )}>
                    {formatPaymentMethodName(method)}
                  </span>
                  {isSelected && (
                    <motion.div 
                      layoutId="check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg z-20"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {!selectedMethod ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                   <Smartphone className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-900 font-black uppercase text-sm tracking-widest">Select a Payment Method</p>
                  <p className="text-slate-500 text-xs font-medium">Choose bKash, Nagad, Rocket, or Upay to see instructions.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="instructions"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  height: "auto", 
                  y: 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden"
              >
                <div className="p-8 md:p-10 space-y-10">
                  {/* Instructions Section */}
                  <div className="space-y-6 text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <h3 className="font-black uppercase text-sm tracking-widest">Payment Instructions</h3>
                    </div>
                    
                    <motion.div 
                      initial={false}
                      animate={{ 
                        boxShadow: selectedMethod ? "0 0 40px -10px rgba(255,176,15,0.1)" : "none",
                        borderColor: selectedMethod ? "rgba(255,176,15,0.2)" : "rgba(226,232,240,1)"
                      }}
                      className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-6 relative overflow-hidden group/amount"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover/amount:bg-primary/10 transition-colors duration-500" />
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">{formatPaymentMethodName(selectedMethodInfo) || 'Payment'} Number</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tight">{displayMobileNumber}</p>
                        </div>
                        <motion.div
                          animate={copied ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={copyToClipboard}
                            className={cn(
                              "rounded-2xl h-12 w-12 border-slate-200 transition-all shadow-sm",
                              copied ? "bg-emerald-50 border-emerald-200 text-emerald-500" : "hover:border-primary hover:text-primary"
                            )}
                          >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </Button>
                        </motion.div>
                      </div>
                      <div className="h-px bg-slate-200/50" />
                      <div className="flex justify-between items-center relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount to Send</p>
                        <motion.p 
                          animate={{ opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="text-3xl font-black text-primary"
                        >
                          ৳{amount}
                        </motion.p>
                      </div>
                    </motion.div>

                    <div className="flex gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="font-bold leading-relaxed">
                        Important: Send the <strong>exact amount</strong> mentioned above using the <span className="underline decoration-amber-300">Send Money</span> option. Payments with incorrect amounts or missing Transaction IDs will not be approved.
                      </p>
                    </div>
                  </div>

                  {/* Transaction Form */}
                  <form onSubmit={handleSubmit} className="space-y-6 pt-10 border-t border-slate-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Transaction ID</Label>
                        <Input 
                          placeholder="e.g. 8N7X2P9M" 
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          className="bg-slate-50 border-slate-200 h-14 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all uppercase font-black text-slate-900 placeholder:text-slate-300"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sender Number</Label>
                        <Input 
                          placeholder="01XXXXXXXXX" 
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          className={cn(
                            "bg-slate-50 border-slate-200 h-14 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-black text-slate-900 placeholder:text-slate-300",
                            senderNumber && !senderNumber.replace(/[\s-]/g, "").replace(/^(\+88|88)/, "").match(/^(01)[3-9][0-9]{8}$/) && "border-red-500 focus:ring-red-500/5"
                          )}
                          required
                        />
                        {senderNumber && !senderNumber.replace(/[\s-]/g, "").replace(/^(\+88|88)/, "").match(/^(01)[3-9][0-9]{8}$/) && (
                          <p className="text-[10px] font-bold text-red-500 ml-1 mt-1 animate-pulse">
                            Use 11 digits (e.g. 01XXXXXXXXX)
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full h-16 bg-slate-900 text-white font-black text-xl rounded-[2rem] hover:bg-black transition-all shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
                    >
                      {submitting ? (
                        <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Submitting...</>
                      ) : (
                        <><ShieldCheck className="w-6 h-6 mr-3" /> Confirm Payment</>
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 p-8 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-200/50 text-slate-500">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] leading-relaxed">
            Average approval time: 30-60 minutes during business hours. Access will be granted automatically upon verification.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
