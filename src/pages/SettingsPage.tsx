
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { SecuritySettings } from "@/shared/components/candidate/settings/SecuritySettings";
import { PrivacySettings } from "@/shared/components/candidate/settings/PrivacySettings";
import { NotificationSettings } from "@/shared/components/candidate/settings/NotificationSettings";

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState("security");

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account security, privacy preferences, and notifications.
                </p>
            </div>

            <Tabs defaultValue="security" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>
                                    Manage your password and account security preferences.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SecuritySettings />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Choose how and when you want to be notified.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NotificationSettings />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Privacy & Data</CardTitle>
                                <CardDescription>
                                    Manage your data, export information, or delete your account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PrivacySettings />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
