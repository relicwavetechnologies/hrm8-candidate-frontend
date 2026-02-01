import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
// import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { candidateAssessmentService } from "@/shared/services/candidateAssessmentService";
import type { AssessmentDetails } from "@/shared/services/candidateAssessmentService";
import { QuestionRenderer } from "@/shared/components/candidate/assessment/QuestionRenderer";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
// import { formatDuration, intervalToDuration } from "date-fns";

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // in seconds

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (id) {
      loadAssessment(id);
    }
  }, [id]);

  useEffect(() => {
    // Timer logic
    if (started && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timerRef.current!);
            handleSubmit(true); // Auto submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, timeRemaining]);

  const loadAssessment = async (assessmentId: string) => {
    try {
      const response = await candidateAssessmentService.getAssessment(assessmentId);
      if (response.success && response.data?.assessment) {
        const data = response.data.assessment;
        setAssessment(data);

        // If already in progress, restore state
        if (data.status === 'IN_PROGRESS') {
          setStarted(true);
          // Restore answers if we had them saved? 
          // Currently backend doesn't return partial answers in getAssessmentDetails.
          // Ideally we should fetch them. For MVP, we assume local state is lost on refresh unless we persist to localStorage or backend.
          // For now, let's just let them continue but answers might be reset. 
          // TODO: Implement partial answer saving.

          // Calculate time remaining
          if (data.config?.timeLimitMinutes && data.results?.startedAt) {
            const startTime = new Date(data.results.startedAt).getTime();
            const limitMs = data.config.timeLimitMinutes * 60 * 1000;
            const elapsed = Date.now() - startTime;
            const remainingSeconds = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
            setTimeRemaining(remainingSeconds);
          }
        }
      } else {
        toast.error("Failed to load assessment");
        navigate("/candidate/assessments");
      }
    } catch (error) {
      console.error("Failed to load assessment:", error);
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!assessment) return;

    setLoading(true);
    try {
      const response = await candidateAssessmentService.startAssessment(assessment.id);
      if (response.success) {
        setStarted(true);
        if (assessment.config?.timeLimitMinutes) {
          setTimeRemaining(assessment.config.timeLimitMinutes * 60);
        }
      }
    } catch (error) {
      console.error("Failed to start assessment:", error);
      toast.error("Failed to start assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: any) => {
    if (!assessment?.questions) return;
    const currentQuestion = assessment.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (!assessment?.questions) return;
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment) return;

    // Validate if all questions answered (unless autoSubmit)
    if (!autoSubmit) {
      const unansweredCount = assessment.questions?.filter(q => !answers[q.id]).length || 0;
      if (unansweredCount > 0) {
        if (!confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`)) {
          return;
        }
      } else {
        if (!confirm("Are you sure you want to submit your assessment? You cannot change your answers after submission.")) {
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response
      }));

      const response = await candidateAssessmentService.submitAssessment(assessment.id, formattedAnswers);

      if (response.success) {
        toast.success("Assessment submitted successfully!");
        navigate("/candidate/assessments");
      } else {
        throw new Error(response.error || "Submission failed");
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast.error("Failed to submit assessment. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) return null;

  // Start Screen
  if (!started) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{assessment.jobTitle}</CardTitle>
            <CardDescription className="text-lg">{assessment.roundName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{assessment.questions?.length || 0} Questions</span>
              </div>
              {assessment.config?.timeLimitMinutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{assessment.config.timeLimitMinutes} Minutes</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold">Instructions</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {assessment.config?.instructions || "Please read each question carefully and select the best answer. Good luck!"}
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Once you start the assessment, the timer will begin. Do not refresh or close the browser window.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button size="lg" className="w-full" onClick={handleStart}>
              Start Assessment
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  if (started && questions.length === 0) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error: No Questions Found</CardTitle>
            <CardDescription>
              This assessment doesn't seem to have any questions. Please contact the recruitment team.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate("/candidate/assessments")}>
              Back to Assessments
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold">{assessment.jobTitle}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{assessment.roundName}</span>
              <span>•</span>
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
          </div>

          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl py-8">
        <div className="grid gap-8 md:grid-cols-[1fr_250px]">
          {/* Question Area */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-lg leading-relaxed">
                    <span className="mr-2 text-muted-foreground">{currentQuestionIndex + 1}.</span>
                    {currentQuestion?.questionText || "Question text not available"}
                  </CardTitle>
                  <span className="text-xs font-medium bg-muted px-2 py-1 rounded whitespace-nowrap">
                    {currentQuestion?.points || 0} pts
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {currentQuestion && (
                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={handleAnswerChange}
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                {isLastQuestion ? (
                  <Button onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit Assessment <CheckCircle2 className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar Navigation */}
          <div className="hidden md:block space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`
                                             h-8 w-8 rounded text-xs font-medium flex items-center justify-center transition-colors
                                             ${isCurrent
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : isAnswered
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }
                                         `}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
