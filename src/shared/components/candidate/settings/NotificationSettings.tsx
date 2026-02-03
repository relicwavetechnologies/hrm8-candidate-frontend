
import { useEffect, useState } from "react";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { Loader2, Bell, Mail } from "lucide-react";
import { apiClient } from "@/shared/services/api";

type NotificationPreferences = {
    application_status_changes: boolean;
    interview_reminders: boolean;
    job_match_alerts: boolean;
    messages: boolean;
    system_updates: boolean;
    email_enabled: boolean;
    in_app_enabled: boolean;
};

export function NotificationSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        application_status_changes: true,
        interview_reminders: true,
        job_match_alerts: true,
        messages: true,
        system_updates: true,
        email_enabled: true,
        in_app_enabled: true,
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await apiClient.get<NotificationPreferences>("/api/candidate/notifications/preferences");
            if (response.success && response.data) {
                setPreferences(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch notification preferences:", error);
            // Don't show error toast here to avoid annoyance on first load if it's 404 (defaults used)
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.put("/api/candidate/notifications/preferences", preferences);
            toast.success("Notification preferences saved");
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast.error("Failed to save preferences");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Delivery Channels</h3>
                <div className="grid gap-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="email_enabled" className="flex flex-col space-y-1">
                            <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Receive updates via email</span>
                        </Label>
                        <Switch
                            id="email_enabled"
                            checked={preferences.email_enabled}
                            onCheckedChange={() => handleToggle("email_enabled")}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="in_app_enabled" className="flex flex-col space-y-1">
                            <span className="flex items-center gap-2"><Bell className="h-4 w-4" /> In-App Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Show notifications in the dashboard</span>
                        </Label>
                        <Switch
                            id="in_app_enabled"
                            checked={preferences.in_app_enabled}
                            onCheckedChange={() => handleToggle("in_app_enabled")}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="grid gap-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="application_status" className="flex flex-col space-y-1">
                            <span>Application Updates</span>
                            <span className="font-normal text-xs text-muted-foreground">When your application status changes</span>
                        </Label>
                        <Switch
                            id="application_status"
                            checked={preferences.application_status_changes}
                            onCheckedChange={() => handleToggle("application_status_changes")}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="interview_reminders" className="flex flex-col space-y-1">
                            <span>Interview Reminders</span>
                            <span className="font-normal text-xs text-muted-foreground">Upcoming interview alerts</span>
                        </Label>
                        <Switch
                            id="interview_reminders"
                            checked={preferences.interview_reminders}
                            onCheckedChange={() => handleToggle("interview_reminders")}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="messages" className="flex flex-col space-y-1">
                            <span>Messages</span>
                            <span className="font-normal text-xs text-muted-foreground">New messages from recruiters</span>
                        </Label>
                        <Switch
                            id="messages"
                            checked={preferences.messages}
                            onCheckedChange={() => handleToggle("messages")}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="job_match_alerts" className="flex flex-col space-y-1">
                            <span>Job Alerts</span>
                            <span className="font-normal text-xs text-muted-foreground">New jobs matching your saved searches</span>
                        </Label>
                        <Switch
                            id="job_match_alerts"
                            checked={preferences.job_match_alerts}
                            onCheckedChange={() => handleToggle("job_match_alerts")}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="system_updates" className="flex flex-col space-y-1">
                            <span>System Updates</span>
                            <span className="font-normal text-xs text-muted-foreground">Platform news and feature updates</span>
                        </Label>
                        <Switch
                            id="system_updates"
                            checked={preferences.system_updates}
                            onCheckedChange={() => handleToggle("system_updates")}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
