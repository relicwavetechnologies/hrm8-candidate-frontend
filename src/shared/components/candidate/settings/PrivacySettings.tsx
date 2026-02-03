
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { apiClient } from "@/shared/services/api";
import { useNavigate } from "react-router-dom";
import { useCandidateAuth } from "@/contexts/CandidateAuthContext";

export function PrivacySettings() {
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const navigate = useNavigate();
    const { logout } = useCandidateAuth();

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const response = await apiClient.get<Blob>("/api/candidate/profile/export", {
                // @ts-ignore - axios responseType passed through RequestInit options is a bit hacky but works with our apiClient setup if handled
                responseType: 'blob' as any,
            });

            if (!response.success || !response.data) {
                throw new Error(response.error || "Failed to export data");
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `candidate-data-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Data export started successfully");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export data");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error("Please enter your password to confirm deletion");
            return;
        }

        setIsDeleting(true);
        try {
            await apiClient.delete("/api/candidate/profile", {
                data: { password: deletePassword }
            });

            toast.success("Account deleted successfully");
            logout();
            navigate("/candidate/login");
        } catch (error: any) {
            console.error("Delete failed:", error);
            toast.error(error.response?.data?.error || "Failed to delete account");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Date Export Section */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export Your Data
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Download a copy of your personal data, including your profile, work history, and applications.
                    </p>
                </div>
                <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                    {isExporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        "Download Data Archive (JSON)"
                    )}
                </Button>
            </div>

            <div className="border-t pt-8">
                <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-3">
                                <p>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        Enter your password to confirm
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                    />
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || !deletePassword}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
