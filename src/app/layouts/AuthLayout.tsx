import { Outlet, Link } from 'react-router-dom'
import { Shield, Sparkles } from 'lucide-react'
import logoLight from '@/assets/logo-light.png'
import logoDark from '@/assets/logo-dark.png'

export function AuthLayout() {
    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                            backgroundSize: '20px 20px',
                        }}
                    ></div>
                </div>
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        <Link to="/" className="inline-block mb-12">
                            <img
                                src={logoLight}
                                alt="HRM8"
                                className="h-10 dark:hidden"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                            <img
                                src={logoDark}
                                alt="HRM8"
                                className="h-10 hidden dark:block"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </Link>
                        <div className="space-y-6 max-w-md">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold tracking-tight">Welcome back to HRM8</h1>
                                <p className="text-lg text-white/90">The complete HR and talent management platform</p>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Enterprise Security</p>
                                        <p className="text-sm text-white/80">Bank-level encryption and compliance</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">AI-Powered Insights</p>
                                        <p className="text-sm text-white/80">Smart recommendations and analytics</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-white/80">
                        <p>&copy; {new Date().getFullYear()} HRM8. All rights reserved.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 lg:p-8">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
