import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { CandidateLayout } from './layouts/CandidateLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import CandidateDashboardHome from '@/pages/CandidateDashboardHome'
import JobSearchPage from '@/pages/JobSearchPage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import ProfilePage from '@/pages/ProfilePage'
import AssessmentListPage from '@/pages/AssessmentListPage'
import DocumentsPage from '@/pages/DocumentsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import WorkHistoryPage from '@/pages/WorkHistoryPage'
import QualificationsPage from '@/pages/QualificationsPage'
import SavedJobsPage from '@/pages/SavedJobsPage'
import MessagesPage from '@/pages/MessagesPage'
import ConversationPage from '@/pages/ConversationPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ApplicationTrackingPage from '@/pages/ApplicationTrackingPage'
import JobDetailPage from '@/pages/JobDetailPage'
import CompanyDetailPage from '@/pages/CompanyDetailPage'
import CareersPage from '@/pages/CareersPage'
import OfferDetailPage from '@/pages/OfferDetailPage'
import AssessmentPage from '@/pages/AssessmentPage'
import JobApplicationPage from '@/pages/JobApplicationPage'
import { CandidateAuthGuard } from '@/shared/components/auth/CandidateAuthGuard'

export function AppRoutes() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Public Job Routes */}
            <Route path="/jobs" element={<JobSearchPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/jobs/:id/apply" element={<JobApplicationPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />

            {/* Candidate Protected Routes */}
            <Route element={<CandidateAuthGuard><CandidateLayout /></CandidateAuthGuard>}>
                <Route path="/" element={<Navigate replace to="/candidate/dashboard" />} />
                <Route path="/candidate/dashboard" element={<CandidateDashboardHome />} />
                <Route path="/candidate/jobs" element={<JobSearchPage />} />
                <Route path="/candidate/jobs/:id" element={<JobDetailPage />} />
                <Route path="/candidate/applications" element={<ApplicationsPage />} />
                <Route path="/candidate/applications/:id" element={<ApplicationTrackingPage />} />
                <Route path="/candidate/profile" element={<ProfilePage />} />
                <Route path="/candidate/work-history" element={<WorkHistoryPage />} />
                <Route path="/candidate/qualifications" element={<QualificationsPage />} />
                <Route path="/candidate/documents" element={<DocumentsPage />} />
                <Route path="/candidate/assessments" element={<AssessmentListPage />} />
                <Route path="/candidate/assessments/:id" element={<AssessmentPage />} />
                <Route path="/candidate/saved-jobs" element={<SavedJobsPage />} />
                <Route path="/candidate/messages" element={<MessagesPage />} />
                <Route path="/candidate/messages/:conversationId" element={<ConversationPage />} />
                <Route path="/candidate/notifications" element={<NotificationsPage />} />
                <Route path="/candidate/settings" element={<SettingsPage />} />
                <Route path="/candidate/offers/:id" element={<OfferDetailPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
    )
}
