/**
 * Forgot Password Page
 * Allows candidates to request a password reset
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/shared/services/api';
import { useToast } from '@/shared/hooks/use-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            const response = await apiClient.post('/api/candidate/auth/forgot-password', {
                email: data.email,
            });

            if (response.success) {
                setIsSuccess(true);
                toast({
                    title: 'Email sent',
                    description: 'Check your inbox for password reset instructions.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to send reset email. Please try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardContent className="pt-6 px-0 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <MailCheck className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
                        <p className="text-muted-foreground px-4">
                            We've sent a password reset link to <strong>{getValues('email')}</strong>.
                            Please click the link in your inbox to reset your password.
                        </p>
                    </div>
                    <div className="pt-4 space-y-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/login">Return to Sign In</Link>
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="text-primary hover:underline"
                            >
                                Try again
                            </button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="space-y-1 pb-4 px-0">
                <CardTitle className="text-2xl font-bold tracking-tight">Forgot password?</CardTitle>
                <CardDescription>
                    Enter your email address and we'll send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            {...register('email')}
                            disabled={isLoading}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="px-0">
                <Button variant="ghost" className="w-full" asChild>
                    <Link to="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
