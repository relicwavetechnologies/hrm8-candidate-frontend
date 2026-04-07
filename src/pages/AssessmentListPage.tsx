import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { candidateAssessmentService } from "@/shared/services/candidateAssessmentService";
import type { AssessmentSummary } from "@/shared/services/candidateAssessmentService";
import { format } from "date-fns";
import { Clock, Play, CheckCircle, AlertCircle, FileText, ClipboardCheck, ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

import { CandidatePageLayout } from "@/shared/components/layouts/CandidatePageLayout";

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const response = await candidateAssessmentService.getAssessments();
      if (response.success && response.data?.assessments) {
        setAssessments(response.data.assessments);
      }
    } catch (error) {
      console.error("Failed to load assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "INVITED":
        return <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">Completed</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  const handleStart = (id: string) => {
    navigate(`/candidate/assessments/${id}`);
  };

  if (loading) {
    return (
      <CandidatePageLayout>
        <div className="space-y-4 p-4 md:p-6">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </CandidatePageLayout>
    );
  }

  return (
    <CandidatePageLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Complete assigned assessments to proceed with your applications.
          </p>
        </div>

        {assessments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-bold mb-1">No Assessments</CardTitle>
            <CardDescription className="text-xs">
              You don't have any pending assessments at the moment.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => {
              const canTake = ["INVITED", "PENDING", "IN_PROGRESS"].includes(assessment.status);
              const isInProgress = assessment.status === "IN_PROGRESS";

              return (
                <Card
                  key={assessment.id}
                  className={cn(
                    "flex flex-col overflow-hidden transition-all hover:shadow-md",
                    canTake && "cursor-pointer hover:border-primary/30",
                    isInProgress && "border-amber-200 dark:border-amber-800/50"
                  )}
                  onClick={() => canTake && handleStart(assessment.id)}
                >
                  <CardHeader className="py-3 px-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm font-bold truncate" title={assessment.jobTitle}>
                          {assessment.jobTitle}
                        </CardTitle>
                        <CardDescription className="text-xs truncate mt-0.5">
                          {assessment.roundName}
                        </CardDescription>
                      </div>
                      {getStatusBadge(assessment.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 px-4 py-2">
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Invited {format(new Date(assessment.invitedAt), "MMM d, yyyy")}</span>
                      </div>
                      {assessment.expiryDate && (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Due {format(new Date(assessment.expiryDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {assessment.completedAt && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 shrink-0" />
                          <span>Completed {format(new Date(assessment.completedAt), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <div className="border-t px-4 py-2.5 bg-muted/20">
                    {canTake ? (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStart(assessment.id);
                        }}
                      >
                        {isInProgress ? (
                          <>
                            <Play className="mr-1.5 h-3 w-3" /> Resume Assessment
                          </>
                        ) : (
                          <>
                            <Play className="mr-1.5 h-3 w-3" /> Start Assessment
                          </>
                        )}
                        <ArrowRight className="ml-auto h-3 w-3" />
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" className="w-full h-8 text-xs" disabled>
                        <FileText className="mr-1.5 h-3 w-3" />
                        View Results (Coming Soon)
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </CandidatePageLayout>
  );
}
