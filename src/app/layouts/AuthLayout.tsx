import { Outlet } from 'react-router-dom'
import { Globe2, ShieldCheck, Sparkles } from 'lucide-react'

export function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-background">
            <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/75">
                <div className="absolute inset-0 opacity-20">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)',
                            backgroundSize: '22px 22px',
                        }}
                    />
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
                    <div className="space-y-12">
                        <div className="space-y-3">
                            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                                HRM8 Candidate Portal
                            </div>
                            <div className="space-y-3 max-w-xl">
                                <h1 className="text-4xl font-bold tracking-tight">
                                    The same polished HRM8 entry point, tuned for candidates.
                                </h1>
                                <p className="text-base leading-7 text-primary-foreground/85">
                                    Sign in to track applications, manage your profile, and stay in sync with interview updates from one place.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 max-w-md">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">Secure candidate access</p>
                                    <p className="text-sm text-primary-foreground/80">
                                        Your application history, documents, and profile stay protected behind account authentication.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm">
                                    <Globe2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">Built for global hiring</p>
                                    <p className="text-sm text-primary-foreground/80">
                                        Keep job activity, communications, and interview timing aligned wherever you are.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-white/15 p-2 backdrop-blur-sm">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">A smoother candidate experience</p>
                                    <p className="text-sm text-primary-foreground/80">
                                        Move from discovery to application tracking without bouncing between disconnected screens.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-primary-foreground/80">
                        © {new Date().getFullYear()} HRM8. All rights reserved.
                    </p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 lg:p-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center lg:hidden">
                        <h1 className="text-3xl font-bold tracking-tight">HRM8</h1>
                        <p className="text-sm text-muted-foreground">Candidate Portal</p>
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
