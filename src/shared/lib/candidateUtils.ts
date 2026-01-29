import type { Candidate } from '@/shared/types/entities';
import type { Job } from '@/shared/types/job';

export function formatExperience(years: number): string {
  if (years === 0) return 'Less than 1 year';
  if (years === 1) return '1 year';
  return `${years} years`;
}

export function formatPhoneNumber(phone: string): string {
  // Format as (XXX) XXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function formatSalaryExpectation(min?: number, max?: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (!min && !max) return 'Not specified';
  if (!min) return `Up to ${formatter.format(max!)}`;
  if (!max) return `From ${formatter.format(min)}`;
  return `${formatter.format(min)} - ${formatter.format(max)}`;
}

export function getCandidateStatusColor(status: Candidate['status']): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'placed':
      return 'info';
    case 'inactive':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function getExperienceLevelLabel(level: Candidate['experienceLevel']): string {
  switch (level) {
    case 'entry':
      return 'Entry Level';
    case 'mid':
      return 'Mid Level';
    case 'senior':
      return 'Senior';
    case 'executive':
      return 'Executive';
    default:
      return level;
  }
}

export function filterCandidatesBySkills(candidates: Candidate[], skills: string[], matchAll: boolean = false): Candidate[] {
  if (skills.length === 0) return candidates;

  return candidates.filter(candidate => {
    if (matchAll) {
      return skills.every(skill =>
        candidate.skills.some(cs => cs.toLowerCase() === skill.toLowerCase())
      );
    } else {
      return skills.some(skill =>
        candidate.skills.some(cs => cs.toLowerCase() === skill.toLowerCase())
      );
    }
  });
}

export function sortCandidatesByRelevance(candidates: Candidate[], criteria: 'score' | 'experience' | 'recent'): Candidate[] {
  const sorted = [...candidates];

  switch (criteria) {
    case 'score':
      return sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
    case 'experience':
      return sorted.sort((a, b) => b.experienceYears - a.experienceYears);
    case 'recent':
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    default:
      return sorted;
  }
}

export function calculateMatchScore(candidate: Candidate, job?: Job): number {
  if (!job) return candidate.score || 0;

  // Simple matching algorithm based on skills
  // In a real app, this would be more sophisticated
  let score = 0;
  // const totalFactors = 3;

  // Factor 1: Experience level match (33%)
  score += 33;

  // Factor 2: Skills match (34%)
  // This would need job skills to be available
  score += 34;

  // Factor 3: Location match (33%)
  score += 33;

  return Math.min(100, Math.max(0, score));
}

export function getCandidateFullName(candidate: Candidate | { firstName: string; lastName: string }): string {
  return `${candidate.firstName} ${candidate.lastName}`.trim();
}

export function formatWorkArrangement(arrangement: Candidate['workArrangement']): string {
  switch (arrangement) {
    case 'remote':
      return 'Remote';
    case 'hybrid':
      return 'Hybrid';
    case 'onsite':
      return 'On-site';
    case 'flexible':
      return 'Flexible';
    default:
      return arrangement;
  }
}

export function getSourceLabel(source: Candidate['source']): string {
  switch (source) {
    case 'job_board':
      return 'Job Board';
    case 'referral':
      return 'Referral';
    case 'direct':
      return 'Direct Application';
    case 'linkedin':
      return 'LinkedIn';
    case 'agency':
      return 'Agency';
    case 'career_fair':
      return 'Career Fair';
    case 'other':
      return 'Other';
    default:
      return source;
  }
}

export function getDaysUntilAvailable(availabilityDate?: Date): number | null {
  if (!availabilityDate) return null;
  const now = new Date();
  const diff = availabilityDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatAvailability(availabilityDate?: Date): string {
  const days = getDaysUntilAvailable(availabilityDate);
  if (days === null) return 'Not specified';
  if (days <= 0) return 'Available now';
  if (days <= 7) return `Available in ${days} day${days > 1 ? 's' : ''}`;
  if (days <= 30) return `Available in ${Math.ceil(days / 7)} week${days > 7 ? 's' : ''}`;
  return `Available in ${Math.ceil(days / 30)} month${days > 30 ? 's' : ''}`;
}
