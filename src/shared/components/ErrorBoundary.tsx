import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
                    <div className="bg-destructive/10 p-3 rounded-full">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        An unexpected error occurred. We've been notified and are working on a fix.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Reload Page
                        </Button>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/';
                            }}
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                    {import.meta.env.DEV && (
                        <div className="mt-8 p-4 bg-muted rounded-lg text-left overflow-auto max-w-xl w-full">
                            <p className="font-mono text-xs text-destructive mb-2">{this.state.error?.toString()}</p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
