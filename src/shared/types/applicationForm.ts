export type QuestionType = 
  | 'short_text'      // Short Answer
  | 'long_text'       // Long Answer
  | 'multiple_choice' // Multiple Choice (single select)
  | 'checkbox'        // Multiple Choice (multi-select)
  | 'dropdown'        // Dropdown Selection
  | 'file_upload'     // File Upload (e.g. certifications, licenses)
  | 'date'            // Date picker
  | 'yes_no'          // Yes / No toggle
  | 'number';         // Numeric input

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface ConditionalLogic {
  enabled: boolean;
  dependsOnQuestionId?: string; // ID of the question this depends on
  showWhen?: {
    // For multiple choice, checkbox, dropdown, yes_no
    equals?: string | string[]; // Value(s) that trigger showing this question
    // For text-based questions
    contains?: string;
    isEmpty?: boolean;
    isNotEmpty?: boolean;
  };
}

export interface QuestionEvaluationSettings {
  // Mandatory Response (Auto-disqualify)
  mandatory?: {
    enabled: boolean;
    disqualifyIfBlank: boolean; // Auto-disqualify if not answered
    disqualifyIfIncorrect?: boolean; // Auto-disqualify if answer doesn't match criteria
    correctAnswers?: string[]; // For multiple_choice/dropdown/checkbox: correct option values
    correctPattern?: string; // For text questions: regex pattern for correct answer
    caseSensitive?: boolean; // For pattern matching
  };
  
  // Scoring Rules
  scoring?: {
    enabled: boolean;
    pointsPerAnswer?: Record<string, number>; // For multiple_choice/dropdown/checkbox: option value -> points
    pointsForCorrect?: number; // Points if answer matches correctAnswers/pattern
    pointsForIncorrect?: number; // Points if answer doesn't match (can be negative)
    maxPoints?: number; // Maximum points for this question
    minPointsToPass?: number; // Minimum points needed to pass this question
  };
  
  // Auto-tagging
  autoTagging?: {
    enabled: boolean;
    rules: Array<{
      condition: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in_range';
      value: string | number | string[]; // Value to compare against
      tags: string[]; // Tags to apply if condition is met
      removeTags?: string[]; // Tags to remove if condition is met
    }>;
  };
  
  // Trigger Next Steps
  triggers?: {
    enabled: boolean;
    onPass?: {
      moveToStage?: string; // ApplicationStage (e.g., "Resume Review", "Phone Screen")
      sendAssessmentInvite?: {
        assessmentType: string; // AssessmentType (e.g., "coding", "personality")
        provider: string; // AssessmentProvider (e.g., "hackerrank", "cognify")
        passThreshold?: number;
        expiryDays?: number;
      };
      addTags?: string[];
      removeTags?: string[];
    };
    onFail?: {
      moveToStage?: string; // Usually "Rejected"
      addTags?: string[];
      removeTags?: string[];
      sendRejectionEmail?: boolean;
    };
  };
}

export interface ApplicationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
  };
  order: number;
  conditionalLogic?: ConditionalLogic; // Dynamic question logic
  
  // Smart Evaluation Settings (optional)
  evaluation?: QuestionEvaluationSettings;
}

export interface ApplicationFormConfig {
  id: string;
  name: string;
  description?: string;
  questions: ApplicationQuestion[];
  includeStandardFields: {
    resume: { included: boolean; required: boolean };
    coverLetter: { included: boolean; required: boolean };
    portfolio: { included: boolean; required: boolean };
    linkedIn: { included: boolean; required: boolean };
    website: { included: boolean; required: boolean };
  };
}

export interface LibraryQuestion extends ApplicationQuestion {
  libraryId: string;
  isSystemTemplate: boolean;
  savedAt?: string;
  usageCount?: number;
  category?: string;
}
