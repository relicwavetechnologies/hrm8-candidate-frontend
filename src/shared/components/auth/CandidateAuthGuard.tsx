import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { Loader2 } from 'lucide-react';

interface CandidateAuthGuardProps {
    children: ReactNode;
}

export function CandidateAuthGuard({ children }: CandidateAuthGuardProps) {
    const { isAuthenticated, isLoading } = useCandidateAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
