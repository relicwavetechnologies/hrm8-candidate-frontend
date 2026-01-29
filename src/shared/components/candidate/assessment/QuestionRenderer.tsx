import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Question } from "@/shared/services/candidateAssessmentService";

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
}

export function QuestionRenderer({ question, value, onChange, readOnly = false }: QuestionRendererProps) {

  if (question.questionType === "MULTIPLE_CHOICE") {
    return (
      <div className="space-y-4">
        <RadioGroup
          value={value as string}
          onValueChange={onChange}
          disabled={readOnly}
          className="space-y-3"
        >
          {question.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option} id={`q-${question.id}-opt-${index}`} />
              <Label htmlFor={`q-${question.id}-opt-${index}`} className="flex-1 cursor-pointer font-normal">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  if (question.questionType === "MULTIPLE_SELECT") {
    const selectedValues = (Array.isArray(value) ? value : []) as string[];

    const handleCheckboxChange = (option: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, option]);
      } else {
        onChange(selectedValues.filter(v => v !== option));
      }
    };

    return (
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isChecked = selectedValues.includes(option);
          return (
            <div key={index} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <Checkbox
                id={`q-${question.id}-opt-${index}`}
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                disabled={readOnly}
              />
              <Label htmlFor={`q-${question.id}-opt-${index}`} className="flex-1 cursor-pointer font-normal">
                {option}
              </Label>
            </div>
          );
        })}
      </div>
    );
  }

  if (question.questionType === "SHORT_ANSWER") {
    return (
      <div className="space-y-2">
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="Type your answer here..."
          className="max-w-xl"
        />
      </div>
    );
  }

  if (question.questionType === "LONG_ANSWER") {
    return (
      <div className="space-y-2">
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder="Type your detailed answer here..."
          className="min-h-[150px]"
        />
      </div>
    );
  }

  if (question.questionType === "CODE") {
    return (
      <div className="space-y-2">
        <div className="rounded-md border bg-slate-950 p-4">
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            placeholder="// Write your code here..."
            className="min-h-[300px] font-mono bg-transparent text-slate-50 border-0 focus-visible:ring-0 resize-none"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Write your solution in the code editor above.
        </p>
      </div>
    );
  }

  return <div className="text-red-500">Unsupported question type: {question.questionType}</div>;
}
