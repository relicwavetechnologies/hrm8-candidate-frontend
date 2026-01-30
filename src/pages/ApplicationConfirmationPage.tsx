/**
 * Application Confirmation Page
 * Shows confirmation after successful application submission
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { CandidateAuthGuard } from '@/shared/components/auth/CandidateAuthGuard';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, ArrowRight, User, FileText, Briefcase } from 'lucide-react';

export default function ApplicationConfirmationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <CandidateAuthGuard>
            <CandidatePageLayout
                title="Application Submitted!"
                subtitle="Your application has been successfully submitted"
            >
                <div className="flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl">Application Submitted!</CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Your application has been successfully submitted
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-center space-y-2">
                                <p className="text-muted-foreground">
                                    We've received your application and will review it shortly.
                                </p>
                                {id && (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            Application ID: <span className="font-mono">{id}</span>
                                        </p>
                                        <Button
                                            variant="link"
                                            className="text-primary"
                                            onClick={() => navigate(`/candidate/applications/${id}`)}
                                        >
                                            Track Your Application Status →
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Profile Completion Prompt */}
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Complete Your Profile
                                    </CardTitle>
                                    <CardDescription>
                                        Add more details to your profile to improve your chances
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>• Add work history and experience</p>
                                        <p>• Upload additional documents</p>
                                        <p>• Set job preferences and alerts</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full mt-4"
                                        onClick={() => navigate('/candidate/profile')}
                                    >
                                        Complete Profile
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        id ? navigate(`/candidate/applications/${id}`) : navigate('/candidate/applications')
                                    }
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    {id ? 'View This Application' : 'View Applications'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate('/jobs')}
                                >
                                    <Briefcase className="h-4 w-4 mr-2" />
                                    Browse More Jobs
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <Button
                                    className="w-full"
                                    onClick={() => navigate('/candidate/dashboard')}
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CandidatePageLayout>
        </CandidateAuthGuard>
    );
}
