import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { candidateAssessmentService } from "@/shared/services/candidateAssessmentService";
import type { AssessmentSummary } from "@/shared/services/candidateAssessmentService";
import { format } from "date-fns";
import { Clock, Play, CheckCircle, AlertCircle, FileText } from "lucide-react";

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
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStart = (id: string) => {
    navigate(`/candidate/assessments/${id}`);
  };

  if (loading) {
    return (
      <CandidatePageLayout>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </CandidatePageLayout>
    );
  }

  return (
    <CandidatePageLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
            <p className="text-muted-foreground">
              Complete the assigned assessments to proceed with your applications.
            </p>
          </div>
        </div>

        {assessments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">No Assessments Assigned</CardTitle>
            <CardDescription>
              You don't have any pending assessments at the moment.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1" title={assessment.jobTitle}>
                        {assessment.jobTitle}
                      </CardTitle>
                      <CardDescription>{assessment.roundName}</CardDescription>
                    </div>
                    {getStatusBadge(assessment.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Invited: {format(new Date(assessment.invitedAt), "MMM d, yyyy")}</span>
                    </div>
                    {assessment.expiryDate && (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span>Due: {format(new Date(assessment.expiryDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {assessment.completedAt && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Completed: {format(new Date(assessment.completedAt), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-muted/20">
                  {(assessment.status === "INVITED" || assessment.status === "PENDING" || assessment.status === "IN_PROGRESS") ? (
                    <Button className="w-full" onClick={() => handleStart(assessment.id)}>
                      {assessment.status === "IN_PROGRESS" ? (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Resume Assessment
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Start Assessment
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      View Results (Coming Soon)
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CandidatePageLayout>
  );
}
