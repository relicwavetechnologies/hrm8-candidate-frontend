import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { candidateAssessmentService } from "@/shared/services/candidateAssessmentService";
import type { AssessmentDetails } from "@/shared/services/candidateAssessmentService";
import { QuestionRenderer } from "@/shared/components/candidate/assessment/QuestionRenderer";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  Send,
  Circle,
  CheckCircle,
  LayoutGrid,
  ArrowLeft,
  Timer,
  Award,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

type AssessmentPhase = "loading" | "intro" | "active" | "review" | "submitted" | "completed" | "expired" | "error";

export default function AssessmentPage() {
  const { id, token: urlToken } = useParams<{ id?: string; token?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if this is a public (token-based) or authenticated access
  const isPublic = location.pathname.startsWith("/assessment/");
  const assessmentToken = urlToken || id || "";

  const [phase, setPhase] = useState<AssessmentPhase>("loading");
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load assessment
  useEffect(() => {
    if (assessmentToken) {
      loadAssessment(assessmentToken);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [assessmentToken]);

  // Timer countdown
  useEffect(() => {
    if (phase === "active" && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeRemaining !== null]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== "active") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "n") handleNext();
      if (e.key === "ArrowLeft" || e.key === "p") handlePrevious();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, currentQuestionIndex, assessment]);

  const loadAssessment = async (token: string) => {
    try {
      const response = isPublic
        ? await candidateAssessmentService.getAssessmentPublic(token)
        : await candidateAssessmentService.getAssessment(token);

      if (response.success && response.data?.assessment) {
        const raw = response.data.assessment as any;
        const sourceQuestions = Array.isArray(raw.questions)
          ? raw.questions
          : Array.isArray(raw.assessment_question)
            ? raw.assessment_question
            : [];

        const normalizedQuestions = sourceQuestions.map((q: any, idx: number) => ({
          id: q.id,
          questionText: q.questionText || q.question_text || "",
          questionType: q.questionType || q.question_type || "SHORT_ANSWER",
          options: q.options ?? null,
          points: q.points ?? 0,
          order: q.order ?? idx,
        }));

        const data: AssessmentDetails = {
          ...raw,
          questions: normalizedQuestions,
        };

        setAssessment(data);

        if (data.status === "COMPLETED") {
          setPhase("completed");
        } else if (data.status === "EXPIRED") {
          setPhase("expired");
        } else if (data.status === "IN_PROGRESS") {
          setPhase("active");
          if (data.config?.timeLimitMinutes && raw.started_at) {
            const startTime = new Date(raw.started_at).getTime();
            const limitMs = data.config.timeLimitMinutes * 60 * 1000;
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
            setTimeRemaining(remaining);
            if (remaining <= 0) {
              handleSubmit(true);
              return;
            }
          }
          // Restore saved responses if available
          if (raw.candidate_responses && Array.isArray(raw.candidate_responses)) {
            const restored: Record<string, any> = {};
            raw.candidate_responses.forEach((r: any) => {
              restored[r.question_id || r.questionId] = r.response;
            });
            setAnswers(restored);
          }
        } else {
          setPhase("intro");
        }
      } else {
        setErrorMessage("Assessment not found or link has expired.");
        setPhase("error");
      }
    } catch (error: any) {
      console.error("Failed to load assessment:", error);
      setErrorMessage(error?.message || "Failed to load assessment. Please check your link and try again.");
      setPhase("error");
    }
  };

  const handleStart = async () => {
    if (!assessment) return;
    setPhase("loading");
    try {
      const response = isPublic
        ? await candidateAssessmentService.startAssessmentPublic(assessmentToken)
        : await candidateAssessmentService.startAssessment(assessmentToken);

      if (response.success) {
        setPhase("active");
        if (assessment.config?.timeLimitMinutes) {
          setTimeRemaining(assessment.config.timeLimitMinutes * 60);
        }
        toast.success("Assessment started. Good luck!");
      } else {
        toast.error("Failed to start assessment");
        setPhase("intro");
      }
    } catch (error) {
      console.error("Failed to start assessment:", error);
      toast.error("Failed to start assessment");
      setPhase("intro");
    }
  };

  const handleAnswerChange = useCallback((value: any) => {
    if (!assessment?.questions) return;
    const currentQuestion = assessment.questions[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Auto-save for public route (debounced)
    if (isPublic && autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (isPublic) {
      autoSaveRef.current = setTimeout(() => {
        candidateAssessmentService
          .saveResponsePublic(assessmentToken, currentQuestion.id, value)
          .catch(() => {}); // Silent fail for auto-save
      }, 2000);
    }
  }, [assessment, currentQuestionIndex, isPublic, assessmentToken]);

  const handleNext = useCallback(() => {
    if (!assessment?.questions) return;
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, assessment]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleGoToReview = () => {
    setPhase("review");
  };

  const handleBackToQuestions = (questionIdx?: number) => {
    setPhase("active");
    if (questionIdx !== undefined) setCurrentQuestionIndex(questionIdx);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment) return;

    if (!autoSubmit) {
      const unansweredCount = assessment.questions?.filter((q) => !answers[q.id]).length || 0;
      if (unansweredCount > 0) {
        if (!confirm(`You have ${unansweredCount} unanswered question${unansweredCount > 1 ? "s" : ""}. Submit anyway?`)) {
          return;
        }
      } else {
        if (!confirm("Submit your assessment? You cannot change your answers after submission.")) {
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
      }));

      const response = isPublic
        ? await candidateAssessmentService.submitAssessmentPublic(assessmentToken, formattedAnswers)
        : await candidateAssessmentService.submitAssessment(assessmentToken, formattedAnswers);

      if (response.success) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("submitted");
        toast.success("Assessment submitted successfully!");
      } else {
        throw new Error(response.error || "Submission failed");
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast.error("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining === null) return "";
    if (timeRemaining <= 60) return "text-red-600 dark:text-red-400";
    if (timeRemaining <= 300) return "text-amber-600 dark:text-amber-400";
    return "text-foreground";
  };

  const questions = assessment?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "" && answers[q.id] !== null).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // ─── LOADING ───────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-muted" />
            <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ─────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Assessment Unavailable</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <Button variant="outline" onClick={() => navigate(isPublic ? "/" : "/candidate/assessments")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isPublic ? "Go to Homepage" : "Back to Assessments"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── EXPIRED ───────────────────────────────────────────────
  if (phase === "expired") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Assessment Expired</h1>
            <p className="text-sm text-muted-foreground">
              This assessment has expired. Please contact the recruiter if you need a new invitation.
            </p>
          </div>
          {!isPublic && (
            <Button variant="outline" onClick={() => navigate("/candidate/assessments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── COMPLETED / SUBMITTED ─────────────────────────────────
  if (phase === "completed" || phase === "submitted") {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {phase === "submitted" ? "Assessment Submitted!" : "Assessment Completed"}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {phase === "submitted"
                ? "Your responses have been recorded successfully. The hiring team will review your assessment and get back to you."
                : "You have already completed this assessment. The hiring team will review your responses."}
            </p>
          </div>

          {answeredCount > 0 && phase === "submitted" && (
            <div className="mx-auto max-w-xs rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questions Answered</span>
                <span className="font-semibold">{answeredCount} / {questions.length}</span>
              </div>
              <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            {!isPublic && (
              <Button onClick={() => navigate("/candidate/assessments")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessments
              </Button>
            )}
            {isPublic && (
              <p className="text-xs text-muted-foreground">You can close this window now.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── INTRO SCREEN ──────────────────────────────────────────
  if (phase === "intro") {
    const jobTitle = assessment?.jobTitle || (assessment as any)?.job_title || "Assessment";
    const roundName = assessment?.roundName || (assessment as any)?.round_name || "";
    const questionCount = questions.length;
    const timeLimit = assessment?.config?.timeLimitMinutes;
    const instructions = assessment?.config?.instructions;

    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Award className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{jobTitle}</h1>
            {roundName && <p className="mt-1 text-sm text-muted-foreground">{roundName}</p>}
          </div>

          {/* Info Card */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {/* Stats Row */}
            <div className="grid grid-cols-2 divide-x border-b">
              <div className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{questionCount}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                  <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{timeLimit ? `${timeLimit}` : "—"}</p>
                  <p className="text-xs text-muted-foreground">{timeLimit ? "Minutes" : "No Time Limit"}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-5 space-y-4">
              {instructions && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Instructions</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {instructions}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Before you begin</h3>
                <ul className="space-y-2.5">
                  {[
                    { icon: Shield, text: "Ensure you have a stable internet connection" },
                    { icon: Clock, text: timeLimit ? `You will have ${timeLimit} minutes to complete the assessment` : "There is no time limit for this assessment" },
                    { icon: AlertTriangle, text: "Do not refresh or close the browser window during the assessment" },
                    { icon: CheckCircle2, text: "You can navigate between questions freely before submitting" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action */}
            <div className="border-t bg-muted/30 p-5">
              <Button size="lg" className="w-full h-12 text-sm font-semibold" onClick={handleStart}>
                Start Assessment
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REVIEW SCREEN ─────────────────────────────────────────
  if (phase === "review") {
    const unansweredQuestions = questions.filter((q) => !answers[q.id] || answers[q.id] === "");

    return (
      <div className="min-h-screen bg-background">
        {/* Minimal Header */}
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Button variant="ghost" size="sm" onClick={() => handleBackToQuestions()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Button>

            {timeRemaining !== null && (
              <div className={cn("flex items-center gap-2 font-mono text-sm font-bold", getTimerColor())}>
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold">Review Your Answers</h1>
            <p className="text-sm text-muted-foreground">
              {answeredCount} of {questions.length} questions answered
            </p>
            <Progress value={progress} className="h-2 max-w-xs mx-auto" />
          </div>

          {unansweredQuestions.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {unansweredQuestions.length} unanswered question{unansweredQuestions.length > 1 ? "s" : ""}
                  </p>
                  <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                    You can still submit, but unanswered questions will receive no score.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "" && answers[q.id] !== null;
              const questionText = (q as any).questionText || (q as any).question_text || "";
              return (
                <button
                  key={q.id}
                  onClick={() => handleBackToQuestions(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:bg-muted/50",
                    !isAnswered && "border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                    isAnswered
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isAnswered ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{questionText}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.points} point{q.points !== 1 ? "s" : ""} · {(q.questionType || "").replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  <Badge variant={isAnswered ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                    {isAnswered ? "Answered" : "Skipped"}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Submit */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6">
            <Button
              size="lg"
              className="w-full h-12 text-sm font-semibold"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ─── ACTIVE ASSESSMENT ─────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">No questions found for this assessment.</p>
          <Button variant="outline" onClick={() => navigate(isPublic ? "/" : "/candidate/assessments")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const currentProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {assessment?.jobTitle || (assessment as any)?.job_title || "Assessment"}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                Question {currentQuestionIndex + 1} of {questions.length} · {answeredCount} answered
              </p>
            </div>
          </div>

          {/* Center: Progress */}
          <div className="hidden md:flex flex-1 max-w-xs items-center gap-3">
            <Progress value={currentProgress} className="h-1.5 flex-1" />
            <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {Math.round(currentProgress)}%
            </span>
          </div>

          {/* Right: Timer + Nav toggle */}
          <div className="flex items-center gap-2">
            {timeRemaining !== null && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors",
                  timeRemaining <= 60
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 animate-pulse"
                    : timeRemaining <= 300
                      ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                      : "border-border bg-muted/50 text-foreground"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowQuestionNav(!showQuestionNav)}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Questions</span>
            </Button>
          </div>
        </div>

        {/* Mobile progress */}
        <Progress value={currentProgress} className="h-0.5 rounded-none md:hidden" />
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 md:py-8">
            {/* Question Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {currentQuestionIndex + 1}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {(currentQuestion.questionType || "").replace(/_/g, " ")}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold leading-relaxed">
                  {(currentQuestion as any).questionText || (currentQuestion as any).question_text}
                </h3>
              </div>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {currentQuestion.points} pt{currentQuestion.points !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Answer Area */}
            <div className="rounded-xl border bg-card p-5 md:p-6">
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={handleAnswerChange}
              />
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={isFirst}
                className="h-9 gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-2">
                {/* Quick question dots for mobile */}
                <div className="flex items-center gap-1 sm:hidden">
                  {questions.slice(
                    Math.max(0, currentQuestionIndex - 2),
                    Math.min(questions.length, currentQuestionIndex + 3)
                  ).map((q, i) => {
                    const actualIdx = Math.max(0, currentQuestionIndex - 2) + i;
                    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "" && answers[q.id] !== null;
                    const isCurrent = actualIdx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(actualIdx)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all",
                          isCurrent ? "w-4 bg-primary" : isAnswered ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                      />
                    );
                  })}
                </div>

                {isLast ? (
                  <Button size="sm" className="h-9 gap-1.5" onClick={handleGoToReview}>
                    Review & Submit
                    <Send className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" className="h-9 gap-1.5" onClick={handleNext}>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── Question Navigation Panel ── */}
        <aside
          className={cn(
            "border-l bg-muted/30 transition-all duration-200 overflow-hidden",
            showQuestionNav ? "w-64" : "w-0"
          )}
        >
          <div className="w-64 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Questions
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "" && answers[q.id] !== null;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                        : isAnswered
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                          : "bg-background border border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/80"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 pt-2 border-t">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="h-3 w-3 rounded bg-primary" />
                Current
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50" />
                Answered
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="h-3 w-3 rounded bg-background border border-border" />
                Unanswered
              </div>
            </div>

            {/* Review Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={handleGoToReview}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Review All
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
