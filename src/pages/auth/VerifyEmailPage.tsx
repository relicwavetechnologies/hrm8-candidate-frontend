import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { candidateAuthService } from '@/shared/services/candidateAuthService';

const LAST_VERIFICATION_KEY = 'candidateLastVerification';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email address...');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. Token is missing.');
            return;
        }

        if (hasVerified.current) {
            return;
        }
        hasVerified.current = true;

        const verifyEmail = async () => {
            try {
                const response = await candidateAuthService.verifyEmail(token);

                if (response.success) {
                    setStatus('success');
                    setMessage(response.data?.message || 'Email verified successfully!');
                    localStorage.setItem(
                        LAST_VERIFICATION_KEY,
                        JSON.stringify({
                            email: response.data?.candidate?.email || '',
                            timestamp: new Date().toISOString(),
                        })
                    );
                } else {
                    setStatus('error');
                    setMessage(response.error || 'Verification failed. The link may have expired or is invalid.');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <Card className="border-border/70 bg-background/95 shadow-sm backdrop-blur">
            <CardHeader className="space-y-1 pb-4 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Email Verification</CardTitle>
                <CardDescription>
                    {status === 'verifying' && 'Please wait while we verify your email...'}
                    {status === 'success' && 'Your email has been verified successfully!'}
                    {status === 'error' && 'There was a problem verifying your email.'}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center space-y-6 p-6">
                {status === 'verifying' && (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
                        </div>
                        <p className="text-muted-foreground">{message}</p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="w-full h-11 text-base mt-2"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                        </div>
                        <p className="text-muted-foreground">{message}</p>
                        <div className="flex flex-col w-full gap-3 mt-2">
                            <Button
                                onClick={() => navigate('/login')}
                                variant="outline"
                                className="w-full h-11 text-base"
                            >
                                Back to Sign In
                            </Button>
                            <Button
                                onClick={() => navigate('/register')}
                                variant="ghost"
                                className="w-full text-sm"
                            >
                                Create new account
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
