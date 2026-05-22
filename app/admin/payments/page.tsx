"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  MoreVertical,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Check,
  X,
  CreditCard,
  Phone,
  Hash,
  Wallet,
  FileText,
  Calendar,
  User,
  Building2,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { logAdminActivity } from "@/lib/activity-logger";
import { PermissionGuard } from "@/components/admin/permission-guard";
import { useAdminPermissions } from "@/lib/hooks/use-permissions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const router = useRouter();
  const { hasPermission } = useAdminPermissions();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("manual_payment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("payments fetched:", data);
      console.log("fetch error:", error);

      if (error) throw error;

      const paymentRows = data || [];
      const userIds = Array.from(new Set(paymentRows.map((payment: any) => payment.user_id).filter(Boolean)));

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        console.log("payment profiles:", profileData);
        console.log("profiles fetch error:", profileError);

        if (!profileError) {
          profiles = profileData || [];
        }
      }

      const paymentsWithStudents = paymentRows.map((payment: any) => ({
        ...payment,
        student: profiles.find((profile: any) => profile.id === payment.user_id) || null,
      }));

      setPayments(paymentsWithStudents);
    } catch (error: any) {
      console.log("fetch error:", error);
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: any) => {
    if (!hasPermission("payments_approve")) {
      toast.error("Access Denied: You do not have permission to approve payments.");
      return;
    }
    console.log("FULL PAYMENT OBJECT:", payment);
    console.log("clicked payment id", payment.id);
    console.log("SENDING PAYMENT ID:", payment.id);
    if (!payment?.id) {
      alert("Error: payment.id is missing. Check console for full object.");
      return;
    }
    setProcessing(payment.id);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      await logAdminActivity("APPROVE_PAYMENT", "payment", payment.id, { 
        student_id: payment.user_id,
        amount: payment.amount,
        transaction_id: payment.transaction_id
      });

      await fetchPayments();
      router.refresh();
      toast.success(data.message || "Payment approved");
    } catch (error: any) {
      alert(error.message);
      console.log(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (payment: any) => {
    if (!hasPermission("payments_reject")) {
      toast.error("Access Denied: You do not have permission to reject payments.");
      return;
    }
    console.log("FULL PAYMENT OBJECT:", payment);
    console.log("clicked payment id", payment.id);
    console.log("SENDING PAYMENT ID:", payment.id);
    if (!payment?.id) {
      alert("Error: payment.id is missing. Check console for full object.");
      return;
    }
    setProcessing(payment.id);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      await logAdminActivity("REJECT_PAYMENT", "payment", payment.id, { 
        student_id: payment.user_id,
        amount: payment.amount,
        transaction_id: payment.transaction_id
      });

      await fetchPayments();
      toast.success(data.message || "Payment rejected");
    } catch (error: any) {
      alert(error.message);
      console.log(error);
    } finally {
      setProcessing(null);
    }
  };

  const handleViewReceipt = (payment: any) => {
    console.log("view receipt clicked", payment);
    setSelectedReceipt(payment);
  };

  const getStudentName = (payment: any) => {
    return payment.student?.full_name || payment.student?.email || "Student Payment";
  };

  const getStudentContact = (payment: any) => {
    return payment.student?.email || payment.user_id;
  };

  const getStudentInitials = (payment: any) => {
    const name = payment.student?.full_name || payment.student?.email;
    if (!name) return "ST";

    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = 
      p.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sender_number.includes(searchTerm) ||
      p.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase text-[10px]"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved": return <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold uppercase text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/10 text-red-500 border-none font-bold uppercase text-[10px]"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      bkash: "text-[#D12053] bg-[#D12053]/10",
      nagad: "text-[#F7941E] bg-[#F7941E]/10",
      rocket: "text-[#8C3494] bg-[#8C3494]/10",
      upay: "text-[#FDBB13] bg-[#FDBB13]/10"
    };
    return (
      <Badge className={cn("border-none font-black uppercase text-[10px]", colors[method] || "bg-slate-500/10")}>
        {method}
      </Badge>
    );
  };

  return (
    <PermissionGuard permission="payments_view">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Payments</h1>
            <p className="text-slate-500 dark:text-white/40 mt-1 font-medium">Review and process student subscription payments</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPayments}
            disabled={loading}
            className="h-10 rounded-xl"
          >
            <RefreshCcw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by TrxID, Phone or Name..." 
            className="pl-10 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                filterStatus === status ? "shadow-lg shadow-primary/20" : "bg-white dark:bg-slate-900"
              )}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Student</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount & Plan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-50" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <motion.tr 
                    key={payment.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-slate-100 dark:border-white/10">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                            {getStudentInitials(payment)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{getStudentName(payment)}</p>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-white/40">{getStudentContact(payment)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{payment.transaction_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-bold text-slate-500 dark:text-white/50">{payment.sender_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">৳{payment.amount}</span>
                          {getMethodBadge(payment.payment_method)}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                          {payment.subscription_plans?.name || "Selected Plan"} • Batch {payment.academic_batches?.batch_number || payment.batch_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                      <p className="text-[9px] text-slate-400 dark:text-white/20 mt-1 font-medium">
                        {format(new Date(payment.created_at), 'MMM dd, h:mm a')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                             size="sm" 
                             variant="outline"
                             onClick={(e) => {
                               e.stopPropagation()
                               handleViewReceipt(payment)
                             }}
                             className="relative z-50 pointer-events-auto h-9 w-9 p-0 rounded-lg border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100"
                             title="View Receipt"
                           >
                             <Eye className="w-4 h-4" />
                           </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(payment)
                            }}
                            disabled={processing === payment.id}
                            className="relative z-50 pointer-events-auto h-9 w-9 p-0 rounded-lg border-red-200 dark:border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(payment)
                            }}
                            disabled={processing === payment.id}
                            className="relative z-50 pointer-events-auto h-9 w-9 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreVertical className="w-4 h-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                              <DropdownMenuItem
                                className="text-xs font-bold uppercase tracking-wider cursor-pointer"
                                onClick={() => handleViewReceipt(payment)}
                              >
                                <Eye className="w-3 h-3 mr-2" />
                                View Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Receipt Modal ──────────────────────────────────── */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => { if (!open) setSelectedReceipt(null); }}>
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Payment Receipt
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              Payment request details
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border",
                selectedReceipt.status === "approved" && "bg-emerald-50 border-emerald-100",
                selectedReceipt.status === "rejected" && "bg-red-50 border-red-100",
                selectedReceipt.status === "pending" && "bg-amber-50 border-amber-100",
              )}>
                {getStatusBadge(selectedReceipt.status)}
                <span className="text-xs font-bold text-slate-500 ml-auto">
                  {format(new Date(selectedReceipt.created_at), "MMM dd, yyyy • h:mm a")}
                </span>
              </div>

              {/* Student Info */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student</p>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">
                      {getStudentName(selectedReceipt)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {getStudentContact(selectedReceipt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details Grid */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Transaction ID", value: selectedReceipt.transaction_id, mono: true },
                    { label: "Sender Number", value: selectedReceipt.sender_number, mono: true },
                    { label: "Payment Method", value: selectedReceipt.payment_method?.toUpperCase() },
                    { label: "Amount", value: `৳${selectedReceipt.amount}`, highlight: true },
                    { label: "Plan ID", value: selectedReceipt.subscription_plans?.name || selectedReceipt.plan_id?.slice(0, 8) + "...", mono: true },
                    { label: "Batch", value: selectedReceipt.academic_batches?.batch_number ? `Batch ${selectedReceipt.academic_batches.batch_number}` : selectedReceipt.batch_id?.slice(0, 8) + "..." },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className={cn(
                        "text-sm font-bold text-slate-900 truncate",
                        item.mono && "font-mono tracking-wide",
                        item.highlight && "text-emerald-600 font-black text-base"
                      )}>
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt File */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt Image</p>
                {selectedReceipt.receipt_url ? (
                  <a
                    href={selectedReceipt.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-primary">View Uploaded Receipt</span>
                    <ExternalLink className="w-4 h-4 text-primary ml-auto" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">No receipt uploaded</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for pending */}
              {selectedReceipt.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-500 hover:bg-red-500 hover:text-white"
                    disabled={processing === selectedReceipt.id}
                    onClick={() => { handleReject(selectedReceipt); setSelectedReceipt(null); }}
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                    disabled={processing === selectedReceipt.id}
                    onClick={() => { handleApprove(selectedReceipt); setSelectedReceipt(null); }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PermissionGuard>
  );
}
