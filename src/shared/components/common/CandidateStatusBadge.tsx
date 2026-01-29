import { Badge } from "@/shared/components/ui/badge";
import type { Candidate } from "@/shared/types/entities";

interface CandidateStatusBadgeProps {
  status: Candidate['status'];
}

export function CandidateStatusBadge({ status }: CandidateStatusBadgeProps) {
  const variants: Record<Candidate['status'], { variant: 'success' | 'teal' | 'neutral', label: string }> = {
    active: { variant: 'success', label: 'Active' },
    placed: { variant: 'teal', label: 'Placed' },
    inactive: { variant: 'neutral', label: 'Inactive' },
  };

  const { variant, label } = variants[status];

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}
