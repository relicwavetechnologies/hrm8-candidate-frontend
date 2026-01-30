/**
 * Developer Tools Component
 * Displays session cookies for testing backend endpoints in development mode
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Copy, Check, Code, RefreshCw } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { isDevelopmentMode } from "@/shared/lib/rbacService";
import { apiClient } from "@/shared/services/api";

interface SessionCookie {
    name: string;
    value: string;
    httpOnly: boolean;
}

interface SessionInfo {
    cookies: SessionCookie[];
    detectedUserType?: string;
}

export function DeveloperTools() {
    const { toast } = useToast();
    const [copiedCookie, setCopiedCookie] = useState<string | null>(null);
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const isDev = isDevelopmentMode();

    // Fetch session info from backend
    const fetchSessionInfo = async () => {
        if (!isDev) return;

        try {
            setLoading(true);
            const response = await apiClient.get<SessionInfo>('/api/dev/session-info');
            if (response.success && response.data) {
                setSessionInfo(response.data);
            }
        } catch (error) {
            // Silently fail - might not be authenticated
            setSessionInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessionInfo();
    }, [isDev]);

    // Don't render in production
    if (!isDev) {
        return null;
    }

    // Get all cookies (non-httpOnly)
    const getAllCookies = (): string => {
        return document.cookie;
    };

    // Get session cookies string for curl
    const getSessionCookiesString = (): string => {
        if (!sessionInfo?.cookies.length) return '';
        return sessionInfo.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    };

    // Parse cookies into an object for display
    const parseCookies = (): Record<string, string> => {
        const cookies: Record<string, string> = {};
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = value;
            }
        });
        return cookies;
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedCookie(label);
            toast({
                title: "Copied!",
                description: `${label} copied to clipboard`,
            });
            setTimeout(() => setCopiedCookie(null), 2000);
        }).catch(() => {
            toast({
                title: "Failed to copy",
                description: "Please copy manually",
                variant: "destructive",
            });
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Developer Tools - Session Cookies
                </CardTitle>
                <CardDescription>
                    Copy session cookies to use with curl commands for testing backend endpoints
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Session Cookies from Backend */}
                {sessionInfo && sessionInfo.cookies.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                                Session Cookies (httpOnly) - Ready to Copy! ✅
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchSessionInfo}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {sessionInfo.detectedUserType && (
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                                <p className="text-xs text-green-800 dark:text-green-200">
                                    Detected user type: <strong>{sessionInfo.detectedUserType}</strong>
                                </p>
                            </div>
                        )}

                        {/* All session cookies combined */}
                        <div className="space-y-2">
                            <Label>All Session Cookies (for curl -H "Cookie: ...")</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={getSessionCookiesString()}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(getSessionCookiesString(), "Session cookies")}
                                >
                                    {copiedCookie === "Session cookies" ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Individual session cookies */}
                        <div className="space-y-3">
                            <Label>Individual Session Cookies</Label>
                            {sessionInfo.cookies.map((cookie) => (
                                <div key={cookie.name} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm font-mono">{cookie.name}</Label>
                                            <span className="text-xs text-muted-foreground">(httpOnly)</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(`${cookie.name}=${cookie.value}`, cookie.name)}
                                        >
                                            {copiedCookie === cookie.name ? (
                                                <Check className="h-3 w-3 text-green-600 mr-1" />
                                            ) : (
                                                <Copy className="h-3 w-3 mr-1" />
                                            )}
                                            Copy
                                        </Button>
                                    </div>
                                    <Input
                                        readOnly
                                        value={cookie.value}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-3 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                            {loading ? 'Loading session info...' : 'No session cookies found. Please log in first.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSessionInfo}
                            disabled={loading}
                            className="mt-2"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Check Again
                        </Button>
                    </div>
                )}

                <Separator />

                <div className="space-y-2">
                    <Label>Non-httpOnly Cookies (visible to JavaScript)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={getAllCookies() || "No non-httpOnly cookies found"}
                            className="font-mono text-sm"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(getAllCookies() || "", "Cookie string")}
                            disabled={!getAllCookies()}
                        >
                            {copiedCookie === "Cookie string" ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        These are frontend cookies. Session cookies must be copied from browser DevTools.
                    </p>
                </div>

                <Separator />

                <div className="space-y-3">
                    <Label>Non-httpOnly Cookies (JavaScript-accessible)</Label>
                    {Object.entries(parseCookies()).map(([name, value]) => (
                        <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-mono">{name}</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(`${name}=${value}`, name)}
                                >
                                    {copiedCookie === name ? (
                                        <Check className="h-3 w-3 text-green-600 mr-1" />
                                    ) : (
                                        <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    Copy
                                </Button>
                            </div>
                            <Input
                                readOnly
                                value={value}
                                className="font-mono text-xs"
                            />
                        </div>
                    ))}
                    {Object.keys(parseCookies()).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No JavaScript-accessible cookies found. Session cookies are httpOnly and must be copied from browser DevTools.
                        </p>
                    )}
                </div>

                <Separator />

                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <Label className="text-sm font-semibold">Usage Instructions</Label>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>
                            <strong>Get session cookie from Browser DevTools:</strong>
                            <ul className="ml-4 mt-1 list-disc space-y-1">
                                <li>Open DevTools → Application/Storage → Cookies</li>
                                <li>Copy the session cookie value (e.g., <code className="bg-muted px-1 rounded">consultantSessionId</code>)</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Use with curl test script:</strong>
                            <div className="ml-4 mt-1 font-mono text-xs bg-background p-2 rounded break-all">
                                cd backend && npx ts-node test-scripts/curl-test-template.ts \<br />
                                &nbsp;&nbsp;--cookie "{getSessionCookiesString() || 'cookie-name=value'}" \<br />
                                &nbsp;&nbsp;--endpoint "/api/consultant/auth/me" \<br />
                                &nbsp;&nbsp;--method GET
                            </div>
                        </li>
                        <li>
                            <strong>Or use directly with curl:</strong>
                            <div className="ml-4 mt-1 font-mono text-xs bg-background p-2 rounded break-all">
                                curl -H "Cookie: {getSessionCookiesString() || 'cookie-name=value'}" \<br />
                                &nbsp;&nbsp;http://localhost:3000/api/consultant/auth/me
                            </div>
                        </li>
                    </ol>
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                            <strong>Session Cookie Names:</strong> consultantSessionId (consultants), sessionId (users),
                            hrm8SessionId (HRM8), candidateSessionId (candidates)
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
