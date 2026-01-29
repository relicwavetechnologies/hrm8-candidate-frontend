export interface InterviewParticipant {
  userId: string;
  name: string;
  email: string;
  role: 'interviewer' | 'organizer' | 'observer';
  responseStatus: 'pending' | 'accepted' | 'declined';
}

export interface InterviewFeedback {
  interviewerId: string;
  interviewerName: string;
  technicalSkills?: number;
  communication?: number;
  cultureFit?: number;
  problemSolving?: number;
  customRatings?: Record<string, number>; // For template-based criteria
  overallRating: number;
  strengths: string;
  concerns: string;
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no';
  notes: string;
  submittedAt: string;
}

export interface CalibrationSession {
  id: string;
  name: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed';
  facilitatorId: string;
  facilitatorName: string;
  participants: Array<{
    userId: string;
    name: string;
    role: 'facilitator' | 'participant';
  }>;
  focusInterviews: string[]; // Interview IDs to review
  exercises: Array<{
    id: string;
    type: 'rating-alignment' | 'scenario-review' | 'rubric-discussion' | 'bias-awareness';
    title: string;
    description: string;
    completed: boolean;
  }>;
  alignmentScores?: {
    beforeSession: number;
    afterSession: number;
  };
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  templateId?: string;
  questions?: Array<{
    id: string;
    question: string;
    category: 'technical' | 'behavioral' | 'cultural' | 'general';
    isRequired: boolean;
    expectedDuration: number;
  }>;
  ratingCriteria?: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
  }>;
  interviewers: InterviewParticipant[];
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  type: 'phone' | 'video' | 'in-person' | 'panel';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  agenda?: string;
  feedback: InterviewFeedback[];
  rating?: number;
  recommendation?: 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no';
  recordingUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
