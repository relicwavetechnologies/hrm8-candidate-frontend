import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { getInitials } from "@/shared/lib/candidateUtils";
import { cn } from "@/shared/lib/utils";

interface CandidateAvatarProps {
  name: string;
  photo?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'active' | 'placed' | 'inactive';
  showStatus?: boolean;
}

export function CandidateAvatar({ 
  name, 
  photo, 
  size = 'md', 
  className,
  status,
  showStatus = false 
}: CandidateAvatarProps) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const statusColors = {
    active: 'bg-green-500',
    placed: 'bg-blue-500',
    inactive: 'bg-gray-400',
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={photo} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {showStatus && status && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
