import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Question } from "@/shared/services/candidateAssessmentService";
import { cn } from "@/shared/lib/utils";

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export function QuestionRenderer({ question, value, onChange, readOnly = false }: QuestionRendererProps) {
  const rawType = String((question as any).questionType || (question as any).question_type || "").trim();
  const normalizedType = rawType.toUpperCase().replace(/-/g, "_");
  const resolvedType =
    normalizedType === "SINGLE_CHOICE"
      ? "MULTIPLE_CHOICE"
      : normalizedType === "SINGLE_SELECT"
        ? "MULTIPLE_CHOICE"
        : normalizedType;

  const rawOptions = (question as any).options;
  const normalizedOptions = (() => {
    if (Array.isArray(rawOptions)) {
      return rawOptions.map((opt) => String(opt).trim()).filter(Boolean);
    }
    if (rawOptions && typeof rawOptions === "object") {
      const nested = (rawOptions as { options?: unknown }).options;
      if (Array.isArray(nested)) {
        return nested.map((opt) => String(opt).trim()).filter(Boolean);
      }
    }
    if (typeof rawOptions === "string") {
      const text = rawOptions.trim();
      if (!text) return [];
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map((opt) => String(opt).trim()).filter(Boolean);
        }
      } catch {
        // noop
      }
      return text.split(",").map((opt) => opt.trim()).filter(Boolean);
    }
    return [];
  })();

  const optionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // ─── MULTIPLE CHOICE ───────────────────────────────────────
  if (resolvedType === "MULTIPLE_CHOICE") {
    if (normalizedOptions.length === 0) {
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Your answer</label>
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder="Type your answer here..."
            className="h-11"
          />
        </div>
      );
    }

    return (
      <RadioGroup
        value={value as string}
        onValueChange={onChange}
        disabled={readOnly}
        className="space-y-2"
      >
        {normalizedOptions.map((option, index) => {
          const isSelected = value === option;
          return (
            <label
              key={index}
              htmlFor={`q-${question.id}-opt-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                "hover:bg-muted/50 hover:border-primary/20",
                isSelected && "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/10",
                readOnly && "cursor-default hover:bg-transparent"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {optionLetters[index] || index + 1}
              </div>
              <RadioGroupItem value={option} id={`q-${question.id}-opt-${index}`} className="sr-only" />
              <span className={cn(
                "flex-1 text-sm leading-relaxed",
                isSelected && "font-medium"
              )}>
                {option}
              </span>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </RadioGroup>
    );
  }

  // ─── MULTIPLE SELECT ───────────────────────────────────────
  if (resolvedType === "MULTIPLE_SELECT") {
    const selectedValues = (Array.isArray(value) ? value : []) as string[];

    if (normalizedOptions.length === 0) {
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Your answer(s)</label>
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder="Type your answer(s) here..."
            className="min-h-[120px]"
          />
        </div>
      );
    }

    const handleCheckboxChange = (option: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, option]);
      } else {
        onChange(selectedValues.filter((v) => v !== option));
      }
    };

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
        {normalizedOptions.map((option, index) => {
          const isChecked = selectedValues.includes(option);
          return (
            <label
              key={index}
              htmlFor={`q-${question.id}-opt-${index}`}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                "hover:bg-muted/50 hover:border-primary/20",
                isChecked && "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/10",
                readOnly && "cursor-default hover:bg-transparent"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                isChecked
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {optionLetters[index] || index + 1}
              </div>
              <Checkbox
                id={`q-${question.id}-opt-${index}`}
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                disabled={readOnly}
                className="sr-only"
              />
              <span className={cn(
                "flex-1 text-sm leading-relaxed",
                isChecked && "font-medium"
              )}>
                {option}
              </span>
              {isChecked && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </div>
    );
  }

  // ─── SHORT ANSWER ──────────────────────────────────────────
  if (resolvedType === "SHORT_ANSWER") {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Your answer</label>
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="Type your answer here..."
          className="h-11 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">Keep your answer concise and to the point.</p>
      </div>
    );
  }

  // ─── LONG ANSWER ───────────────────────────────────────────
  if (resolvedType === "LONG_ANSWER") {
    const charCount = (value || "").length;
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Your answer</label>
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="Write your detailed answer here..."
          className="min-h-[200px] text-sm leading-relaxed resize-y"
        />
        <div className="flex justify-between">
          <p className="text-[10px] text-muted-foreground">Provide a thorough, well-structured response.</p>
          <span className="text-[10px] tabular-nums text-muted-foreground">{charCount} characters</span>
        </div>
      </div>
    );
  }

  // ─── CODE ──────────────────────────────────────────────────
  if (resolvedType === "CODE") {
    const lineCount = (value || "").split("\n").length;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Code Editor</label>
          <span className="text-[10px] tabular-nums text-muted-foreground">{lineCount} line{lineCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden">
          {/* Editor Header Bar */}
          <div className="flex items-center gap-1.5 border-b border-slate-800 px-4 py-2.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-amber-500/70" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-[10px] text-slate-500 font-mono">solution</span>
          </div>
          {/* Editor Body */}
          <div className="relative">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-900/50 border-r border-slate-800 pointer-events-none flex flex-col pt-4 items-center">
              {Array.from({ length: Math.max(lineCount, 15) }, (_, i) => (
                <span key={i} className="text-[10px] leading-[1.625rem] text-slate-600 font-mono tabular-nums">
                  {i + 1}
                </span>
              ))}
            </div>
            <Textarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
              placeholder="// Write your code here..."
              className={cn(
                "min-h-[350px] pl-14 pr-4 py-4 font-mono text-sm leading-[1.625rem]",
                "bg-transparent text-emerald-300 border-0 rounded-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0 resize-y",
                "placeholder:text-slate-600"
              )}
              spellCheck={false}
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Write your solution. Use proper indentation and comments for clarity.
        </p>
      </div>
    );
  }

  // ─── FALLBACK ──────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Unsupported question type: <code className="font-mono text-xs">{rawType || "unknown"}</code>
      </p>
      <div className="mt-3">
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="Type your answer here..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
