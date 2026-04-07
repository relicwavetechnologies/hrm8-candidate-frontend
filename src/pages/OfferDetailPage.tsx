/**
 * Candidate Offer Detail Page
 * Interactive, visually rich view for candidates to review, accept, decline, or negotiate offers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { offerService } from "@/shared/services/api/offerService";
import type { NegotiationMessage, OfferDocument } from "@/shared/services/api/offerService";
import type { OfferLetter } from "@/shared/types/offer";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  Gift,
  TrendingUp,
  Award,
  Palmtree,
  Shield,
  Send,
  AlertTriangle,
  ChevronRight,
  FileCheck,
  FileClock,
  FileX,
  CloudUpload,
} from "lucide-react";

import { CandidatePageLayout } from "@/shared/components/layouts/CandidatePageLayout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function salaryPeriodLabel(period: string): string {
  const map: Record<string, string> = { annual: "per year", hourly: "per hour", monthly: "per month" };
  return map[period] ?? period;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const docStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  REQUESTED: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: FileClock },
  SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-700 border-blue-200", icon: FileText },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: FileCheck },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: FileX },
  "REVISION-REQUIRED": { label: "Revision Required", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CompensationCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 flex flex-col gap-2 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

function ExpiryCountdown({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate);
  const isUrgent = days <= 3;
  const isExpired = days < 0;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">This offer has expired</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
        isUrgent
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      <Clock className="h-4 w-4" />
      <span className="font-medium">
        {days === 0
          ? "Expires today"
          : days === 1
          ? "Expires tomorrow"
          : `Expires in ${days} days`}
      </span>
      <span className="text-xs opacity-70">({new Date(expiryDate).toLocaleDateString()})</span>
    </div>
  );
}

function NegotiationBubble({ msg, isCandidate }: { msg: NegotiationMessage; isCandidate: boolean }) {
  return (
    <div className={`flex ${isCandidate ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] space-y-2 rounded-2xl px-5 py-3.5 ${
          isCandidate
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted/40 border border-border/60 rounded-bl-md"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${isCandidate ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {msg.senderName}
          </span>
          <span className={`text-[10px] ${isCandidate ? "text-primary-foreground/60" : "text-muted-foreground/70"}`}>
            {relativeTime(msg.createdAt)}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${isCandidate ? "" : "text-foreground"}`}>{msg.message}</p>
        {msg.proposedChanges && Object.keys(msg.proposedChanges).length > 0 && (
          <div
            className={`mt-2 rounded-xl border p-3 text-xs space-y-1 ${
              isCandidate
                ? "border-primary-foreground/20 bg-primary-foreground/10"
                : "border-border/60 bg-background"
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${isCandidate ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              Proposed Changes
            </p>
            {Object.entries(msg.proposedChanges).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-medium">{typeof val === "number" ? val.toLocaleString() : String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OfferDetailPage() {
  const { offerId } = useParams<{ offerId: string }>();
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [negotiations, setNegotiations] = useState<NegotiationMessage[]>([]);
  const [documents, setDocuments] = useState<OfferDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog / action state
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  // Inline negotiation
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [proposedSalary, setProposedSalary] = useState("");
  const [showSalaryInput, setShowSalaryInput] = useState(false);
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Upload dialog
  const [uploadDocId, setUploadDocId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadOfferData = useCallback(async () => {
    if (!offerId) return;
    setLoading(true);
    try {
      const [offerRes, negotiationsRes, documentsRes] = await Promise.all([
        offerService.getOffer(offerId),
        offerService.getNegotiationHistory(offerId),
        offerService.getRequiredDocuments(offerId),
      ]);
      if (offerRes.success && offerRes.data) setOffer(offerRes.data);
      if (negotiationsRes.success && negotiationsRes.data) setNegotiations(negotiationsRes.data);
      if (documentsRes.success && documentsRes.data) setDocuments(documentsRes.data);
    } catch (error) {
      console.error("Failed to load offer:", error);
      toast.error("Failed to load offer");
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    if (offerId) loadOfferData();
  }, [offerId, loadOfferData]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [negotiations]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleAccept = async () => {
    if (!offerId) return;
    setAccepting(true);
    try {
      const response = await offerService.acceptOffer(offerId);
      if (response.success) {
        toast.success("Offer accepted! We look forward to having you on the team.");
        setShowAcceptDialog(false);
        loadOfferData();
      } else {
        toast.error("Failed to accept offer", { description: response.error });
      }
    } catch (error) {
      console.error("Failed to accept offer:", error);
      toast.error("Failed to accept offer");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!offerId) return;
    setDeclining(true);
    try {
      const response = await offerService.declineOffer(offerId, declineReason);
      if (response.success) {
        toast.success("Offer declined");
        setShowDeclineDialog(false);
        setDeclineReason("");
        loadOfferData();
      } else {
        toast.error("Failed to decline offer", { description: response.error });
      }
    } catch (error) {
      console.error("Failed to decline offer:", error);
      toast.error("Failed to decline offer");
    } finally {
      setDeclining(false);
    }
  };

  const handleSendNegotiation = async () => {
    if (!offerId || !negotiationMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setSending(true);
    try {
      const proposedChanges: Record<string, unknown> = {};
      if (proposedSalary) proposedChanges.salary = parseFloat(proposedSalary);

      const response = await offerService.initiateNegotiation(offerId, {
        message: negotiationMessage,
        proposedChanges: Object.keys(proposedChanges).length > 0 ? proposedChanges : undefined,
      });
      if (response.success) {
        toast.success("Message sent");
        setNegotiationMessage("");
        setProposedSalary("");
        setShowSalaryInput(false);
        loadOfferData();
      } else {
        toast.error("Failed to send message", { description: response.error });
      }
    } catch (error) {
      console.error("Failed to send negotiation:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (docId: string, file: File) => {
    if (!offerId) return;
    // In a real app this would upload to storage first; here we simulate with the file name
    try {
      const response = await offerService.uploadDocument(offerId, docId, {
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
      });
      if (response.success) {
        toast.success(`"${file.name}" uploaded successfully`);
        setUploadDocId(null);
        loadOfferData();
      } else {
        toast.error("Upload failed", { description: response.error });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed");
    }
  };

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------

  const canAct = offer?.status === "sent" || (offer?.status as string) === "under-negotiation";
  const canNegotiate = canAct;

  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    "pending-approval": { label: "Pending Approval", className: "bg-amber-100 text-amber-700 border-amber-200" },
    approved: { label: "Approved", className: "bg-blue-100 text-blue-700 border-blue-200" },
    sent: { label: "Sent", className: "bg-violet-100 text-violet-700 border-violet-200" },
    "under-negotiation": { label: "Under Negotiation", className: "bg-amber-100 text-amber-700 border-amber-200" },
    accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    declined: { label: "Declined", className: "bg-red-100 text-red-700 border-red-200" },
    expired: { label: "Expired", className: "bg-slate-100 text-slate-500 border-slate-200" },
    withdrawn: { label: "Withdrawn", className: "bg-red-100 text-red-600 border-red-200" },
  };

  const currentStatus = offer ? statusConfig[offer.status] ?? { label: offer.status, className: "" } : null;

  const docsProgress = useMemo(() => {
    if (documents.length === 0) return 0;
    const done = documents.filter((d) => d.status === "APPROVED" || d.status === "SUBMITTED").length;
    return Math.round((done / documents.length) * 100);
  }, [documents]);

  // -----------------------------------------------------------------------
  // Loading / empty states
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <CandidatePageLayout>
        <div className="container mx-auto max-w-4xl py-12">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/40" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        </div>
      </CandidatePageLayout>
    );
  }

  if (!offer) {
    return (
      <CandidatePageLayout>
        <div className="container mx-auto max-w-4xl py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Offer not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">The offer you are looking for does not exist or has been removed.</p>
        </div>
      </CandidatePageLayout>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <CandidatePageLayout>
      <div className="container mx-auto max-w-4xl pb-32 pt-8">
        {/* ---- Header ---- */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Offer for</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">{offer.jobTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground capitalize">{offer.offerType.replace(/-/g, " ")} position</p>
            </div>
            {currentStatus && (
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            )}
          </div>

          {offer.expiryDate && (
            <div className="mt-4">
              <ExpiryCountdown expiryDate={offer.expiryDate} />
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* ================================================================
              COMPENSATION BREAKDOWN
             ================================================================ */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Compensation</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <CompensationCard
                icon={DollarSign}
                label="Base Salary"
                value={formatCurrency(offer.salary, offer.salaryCurrency)}
                sublabel={salaryPeriodLabel(offer.salaryPeriod)}
              />
              <CompensationCard
                icon={TrendingUp}
                label="Bonus"
                value={offer.bonusStructure ?? "--"}
                sublabel={offer.bonusStructure ? "Performance based" : "Not included"}
              />
              <CompensationCard
                icon={Award}
                label="Equity"
                value={offer.equityOptions ?? "--"}
                sublabel={offer.equityOptions ? "Stock options" : "Not included"}
              />
              <CompensationCard
                icon={Gift}
                label="Benefits"
                value={offer.benefits && offer.benefits.length > 0 ? `${offer.benefits.length} perks` : "--"}
                sublabel={offer.benefits?.slice(0, 2).join(", ")}
              />
            </div>

            {/* Total compensation summary */}
            <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">Total Annual Compensation</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {offer.salaryPeriod === "annual"
                    ? formatCurrency(offer.salary, offer.salaryCurrency)
                    : offer.salaryPeriod === "hourly"
                    ? `${formatCurrency(offer.salary * 2080, offer.salaryCurrency)} (est.)`
                    : formatCurrency(offer.salary * 12, offer.salaryCurrency)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                {offer.salaryPeriod === "hourly"
                  ? "Estimated based on 2,080 working hours per year. Excludes bonus and equity."
                  : "Base salary only. Excludes bonus and equity."}
              </p>
            </div>

            {/* Benefits list */}
            {offer.benefits && offer.benefits.length > 0 && (
              <div className="mt-3 rounded-2xl border border-border/60 bg-muted/20 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Benefits Included</p>
                <div className="flex flex-wrap gap-2">
                  {offer.benefits.map((benefit, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ================================================================
              OFFER DETAILS
             ================================================================ */}
          <section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Offer Details</p>
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-border/40">
                  {/* Start date */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Start Date</span>
                    </div>
                    <p className="text-sm font-semibold">{new Date(offer.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>

                  {/* Work location */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Location</span>
                    </div>
                    <p className="text-sm font-semibold">{offer.workLocation}</p>
                  </div>

                  {/* Work arrangement */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Arrangement</span>
                    </div>
                    <p className="text-sm font-semibold capitalize">{offer.workArrangement.replace(/-/g, " ")}</p>
                  </div>

                  {/* Probation */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Probation</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.probationPeriod ? `${offer.probationPeriod} months` : "None"}
                    </p>
                  </div>

                  {/* Vacation */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Palmtree className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vacation</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {offer.vacationDays ? `${offer.vacationDays} days / year` : "--"}
                    </p>
                  </div>

                  {/* Offer type */}
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Type</span>
                    </div>
                    <p className="text-sm font-semibold capitalize">{offer.offerType.replace(/-/g, " ")}</p>
                  </div>
                </div>

                {/* Custom terms */}
                {offer.customTerms && offer.customTerms.length > 0 && (
                  <>
                    <Separator />
                    <div className="p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Additional Terms</p>
                      <div className="space-y-2">
                        {offer.customTerms.map((term, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                            <div>
                              <span className="text-xs font-medium">{term.key}:</span>{" "}
                              <span className="text-xs text-muted-foreground">{term.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom message from employer */}
                {offer.customMessage && (
                  <>
                    <Separator />
                    <div className="p-5 bg-muted/10">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Message from Employer</p>
                      <p className="text-sm leading-relaxed text-foreground/80 italic">"{offer.customMessage}"</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ================================================================
              REQUIRED DOCUMENTS
             ================================================================ */}
          {documents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Required Documents</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-default">{docsProgress}% complete</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {documents.filter((d) => d.status === "APPROVED" || d.status === "SUBMITTED").length} of {documents.length} documents submitted
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={docsProgress} className="h-1.5 mb-4 rounded-full" />

              <div className="space-y-3">
                {documents.map((doc) => {
                  const cfg = docStatusConfig[doc.status.toUpperCase()] ?? docStatusConfig.REQUESTED;
                  const StatusIcon = cfg.icon;
                  const isDropTarget = dragOver === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                        isDropTarget
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/60 bg-muted/20"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(doc.id);
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(null);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileUpload(doc.id, file);
                      }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 rounded-xl p-2 border ${cfg.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            {doc.isRequired && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-red-500">Required</span>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.description}</p>
                          )}
                          {doc.fileName && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {doc.fileName}
                            </p>
                          )}
                          {doc.reviewNotes && (
                            <p className="text-xs text-amber-600 mt-1">Note: {doc.reviewNotes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {(doc.status === "REQUESTED" || doc.status === "REVISION-REQUIRED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs gap-1.5"
                            onClick={() => {
                              setUploadDocId(doc.id);
                              fileInputRef.current?.click();
                            }}
                          >
                            <CloudUpload className="h-3.5 w-3.5" />
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && uploadDocId) {
                    handleFileUpload(uploadDocId, file);
                    e.target.value = "";
                  }
                }}
              />
            </section>
          )}

          {/* ================================================================
              NEGOTIATION THREAD
             ================================================================ */}
          <section data-negotiation-section>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Negotiation{negotiations.length > 0 ? ` (${negotiations.length})` : ""}
            </p>
            <Card className="rounded-2xl border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {negotiations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No negotiations yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                      If you would like to discuss the terms, start a conversation below.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto p-5 space-y-4">
                    {negotiations.map((msg) => (
                      <NegotiationBubble
                        key={msg.id}
                        msg={msg}
                        isCandidate={msg.senderType === "candidate"}
                      />
                    ))}
                    <div ref={threadEndRef} />
                  </div>
                )}

                {/* Reply input */}
                {canNegotiate && (
                  <>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {showSalaryInput && (
                        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Proposed Salary ({offer.salaryCurrency})
                            </Label>
                            <Input
                              type="number"
                              value={proposedSalary}
                              onChange={(e) => setProposedSalary(e.target.value)}
                              placeholder={`e.g. ${(offer.salary * 1.1).toFixed(0)}`}
                              className="h-8 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground"
                            onClick={() => {
                              setShowSalaryInput(false);
                              setProposedSalary("");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Textarea
                            value={negotiationMessage}
                            onChange={(e) => setNegotiationMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={2}
                            className="rounded-xl resize-none text-sm"
                          />
                          {!showSalaryInput && (
                            <button
                              type="button"
                              className="text-[10px] font-semibold uppercase tracking-widest text-primary hover:underline"
                              onClick={() => setShowSalaryInput(true)}
                            >
                              + Add salary proposal
                            </button>
                          )}
                        </div>
                        <Button
                          onClick={handleSendNegotiation}
                          disabled={sending || !negotiationMessage.trim()}
                          className="rounded-xl gap-1.5"
                        >
                          <Send className="h-4 w-4" />
                          {sending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* ================================================================
          STICKY ACTION BAR
         ================================================================ */}
      {canAct && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto max-w-4xl flex items-center justify-between gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setShowDeclineDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => {
                  const el = document.querySelector("[data-negotiation-section]");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Negotiate
              </Button>
              <Button
                size="lg"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/20"
                onClick={() => setShowAcceptDialog(true)}
              >
                <CheckCircle className="h-4 w-4" />
                Accept Offer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          ACCEPT CONFIRMATION DIALOG
         ================================================================ */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to accept the <span className="font-medium text-foreground">{offer?.jobTitle}</span> offer with a base salary of{" "}
              <span className="font-medium text-foreground">{offer ? formatCurrency(offer.salary, offer.salaryCurrency) : ""}</span>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={accepting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleAccept();
              }}
              disabled={accepting}
            >
              {accepting ? "Accepting..." : "Yes, Accept Offer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================
          DECLINE DIALOG
         ================================================================ */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Decline this offer</DialogTitle>
            <DialogDescription>
              We are sorry to see you go. You may optionally share a reason with the employer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Reason (optional)
              </Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Accepted another opportunity, compensation expectations..."
                rows={3}
                className="mt-1.5 rounded-xl text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowDeclineDialog(false)} disabled={declining}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={handleDecline}
                disabled={declining}
              >
                {declining ? "Declining..." : "Decline Offer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CandidatePageLayout>
  );
}
