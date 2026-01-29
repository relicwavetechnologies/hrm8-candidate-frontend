/**
 * Candidate Offer Detail Page
 * Allows candidates to view, accept, decline, or negotiate offers
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { offerService } from "@/shared/services/api/offerService";
import type { NegotiationMessage, OfferDocument } from "@/shared/services/api/offerService";
import type { OfferLetter } from "@/shared/types/offer";
import { toast } from "sonner";
import { CheckCircle, XCircle, MessageSquare, FileText, Upload, DollarSign, Calendar, MapPin, Briefcase } from "lucide-react";

export default function OfferDetailPage() {
  const { offerId } = useParams<{ offerId: string }>();
  // const navigate = useNavigate();
  const [offer, setOffer] = useState<OfferLetter | null>(null);
  const [negotiations, setNegotiations] = useState<NegotiationMessage[]>([]);
  const [documents, setDocuments] = useState<OfferDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNegotiationDialog, setShowNegotiationDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState("");
  const [proposedSalary, setProposedSalary] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  useEffect(() => {
    if (offerId) {
      loadOfferData();
    }
  }, [offerId]);

  const loadOfferData = async () => {
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
      console.error('Failed to load offer:', error);
      toast.error("Failed to load offer");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!offerId) return;

    try {
      const response = await offerService.acceptOffer(offerId);
      if (response.success) {
        toast.success("Offer accepted! We look forward to having you on the team.");
        loadOfferData();
      } else {
        toast.error("Failed to accept offer", { description: response.error });
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      toast.error("Failed to accept offer");
    }
  };

  const handleDecline = async () => {
    if (!offerId) return;

    try {
      const response = await offerService.declineOffer(offerId, declineReason);
      if (response.success) {
        toast.success("Offer declined");
        setShowDeclineDialog(false);
        loadOfferData();
      } else {
        toast.error("Failed to decline offer", { description: response.error });
      }
    } catch (error) {
      console.error('Failed to decline offer:', error);
      toast.error("Failed to decline offer");
    }
  };

  const handleInitiateNegotiation = async () => {
    if (!offerId || !negotiationMessage.trim()) {
      toast.error("Please enter a negotiation message");
      return;
    }

    try {
      const proposedChanges: any = {};
      if (proposedSalary) {
        proposedChanges.salary = parseFloat(proposedSalary);
      }

      const response = await offerService.initiateNegotiation(offerId, {
        message: negotiationMessage,
        proposedChanges: Object.keys(proposedChanges).length > 0 ? proposedChanges : undefined,
      });

      if (response.success) {
        toast.success("Negotiation request sent");
        setShowNegotiationDialog(false);
        setNegotiationMessage("");
        setProposedSalary("");
        loadOfferData();
      } else {
        toast.error("Failed to send negotiation request", { description: response.error });
      }
    } catch (error) {
      console.error('Failed to initiate negotiation:', error);
      toast.error("Failed to send negotiation request");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      "pending-approval": "secondary",
      approved: "default",
      sent: "default",
      "under-negotiation": "secondary",
      accepted: "default",
      declined: "destructive",
      expired: "outline",
      withdrawn: "destructive",
    };
    return <Badge variant={variants[status.toLowerCase()] || "outline"}>{status.replace(/-/g, ' ').replace(/_/g, ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading offer...</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Offer not found</div>
      </div>
    );
  }

  const canAccept = offer.status === 'sent';
  const canDecline = canAccept;
  const canNegotiate = canAccept;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Offer</h1>
        <div className="flex items-center gap-2">
          {getStatusBadge(offer.status)}
          <span className="text-muted-foreground">{offer.jobTitle}</span>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Offer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Salary</span>
                </div>
                <p className="text-lg font-semibold">
                  ${offer.salary.toLocaleString()} {offer.salaryCurrency} / {offer.salaryPeriod}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Start Date</span>
                </div>
                <p className="text-lg font-semibold">{new Date(offer.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Location</span>
                </div>
                <p className="text-lg font-semibold">{offer.workLocation}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm">Arrangement</span>
                </div>
                <p className="text-lg font-semibold capitalize">{offer.workArrangement.replace(/-/g, ' ')}</p>
              </div>
            </div>

            {offer.benefits && offer.benefits.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Benefits</p>
                  <ul className="list-disc list-inside space-y-1">
                    {offer.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm">{benefit}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {offer.vacationDays && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Vacation Days</p>
                  <p className="text-sm text-muted-foreground">{offer.vacationDays} days</p>
                </div>
              </>
            )}

            {offer.customMessage && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Message</p>
                  <p className="text-sm text-muted-foreground">{offer.customMessage}</p>
                </div>
              </>
            )}

            {offer.expiryDate && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Response Deadline</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(offer.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Negotiations */}
        {negotiations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Negotiation History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {negotiations.map((neg) => (
                <div key={neg.id} className="border-l-4 border-primary pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{neg.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(neg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{neg.message}</p>
                  {neg.proposedChanges && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Proposed changes: {JSON.stringify(neg.proposedChanges, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Required Documents */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    )}
                    <Badge variant="outline" className="mt-2">{doc.status}</Badge>
                  </div>
                  {doc.status === 'REQUESTED' && (
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canAccept && (
          <div className="flex gap-4">
            <Button
              onClick={handleAccept}
              className="flex-1"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Accept Offer
            </Button>
            {canNegotiate && (
              <Button
                onClick={() => setShowNegotiationDialog(true)}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Negotiate
              </Button>
            )}
            {canDecline && (
              <Button
                onClick={() => setShowDeclineDialog(true)}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Decline
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Negotiation Dialog */}
      <Dialog open={showNegotiationDialog} onOpenChange={setShowNegotiationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Negotiate Offer</DialogTitle>
            <DialogDescription>
              Send a message to the employer with your proposed changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message *</Label>
              <Textarea
                value={negotiationMessage}
                onChange={(e) => setNegotiationMessage(e.target.value)}
                placeholder="Explain what you'd like to negotiate..."
                rows={4}
              />
            </div>
            <div>
              <Label>Proposed Salary (Optional)</Label>
              <Input
                type="number"
                value={proposedSalary}
                onChange={(e) => setProposedSalary(e.target.value)}
                placeholder="Enter proposed salary"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNegotiationDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleInitiateNegotiation} className="flex-1">
                Send Negotiation Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Offer</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Why are you declining this offer?"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeclineDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDecline}
                className="flex-1"
              >
                Decline Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


