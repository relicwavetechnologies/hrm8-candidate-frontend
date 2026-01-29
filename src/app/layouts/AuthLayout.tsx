import { Outlet } from 'react-router-dom'

export function AuthLayout() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">HRM8</h1>
                    <p className="text-sm text-muted-foreground">Candidate Portal</p>
                </div>
                <Outlet />
            </div>
        </div>
    )
}
