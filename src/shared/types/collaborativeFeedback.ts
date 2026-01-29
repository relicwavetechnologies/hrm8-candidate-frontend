export type RatingScale = '1-5' | '1-10' | 'binary' | 'letter';

export interface RatingCriterion {
  id: string;
  name: string;
  description: string;
  scale: RatingScale;
  weight: number;
  category: 'technical' | 'cultural' | 'communication' | 'leadership' | 'custom';
}

export interface CriteriaRating {
  criterionId: string;
  value: number | string;
  confidence: number; // 1-5
  notes?: string;
}

export interface StructuredComment {
  id: string;
  type: 'strength' | 'concern' | 'observation' | 'question';
  category: string;
  content: string;
  importance: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface TeamMemberFeedback {
  id: string;
  candidateId: string;
  applicationId?: string;
  interviewId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  ratings: CriteriaRating[];
  comments: StructuredComment[];
  overallScore: number;
  recommendation: 'strong-hire' | 'hire' | 'maybe' | 'no-hire' | 'strong-no-hire';
  confidence: number; // 1-5
  submittedAt: string;
  updatedAt: string;
}

export interface HiringVote {
  id: string;
  candidateId: string;
  voterId: string;
  voterName: string;
  voterRole: string;
  decision: 'hire' | 'no-hire' | 'abstain';
  reasoning: string;
  votedAt: string;
}

export interface ConsensusMetrics {
  candidateId: string;
  totalFeedbacks: number;
  averageScore: number;
  scoreStdDev: number;
  agreementLevel: number; // 0-1
  criteriaAverages: Record<string, number>;
  recommendationDistribution: Record<string, number>;
  voteResults: {
    hire: number;
    noHire: number;
    abstain: number;
  };
  topStrengths: string[];
  topConcerns: string[];
  lastUpdated: string;
}

export interface DecisionHistoryEntry {
  id: string;
  candidateId: string;
  decision: 'offer-extended' | 'rejected' | 'moved-forward' | 'hold';
  decidedBy: string;
  decidedByName: string;
  consensusScore: number;
  votingResults: {
    hire: number;
    noHire: number;
    abstain: number;
  };
  rationale: string;
  decidedAt: string;
}

export interface CandidateComparison {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  consensusMetrics: ConsensusMetrics;
  feedback: TeamMemberFeedback[];
  votes: HiringVote[];
  decisionHistory: DecisionHistoryEntry[];
}
