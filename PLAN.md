# HRM8 Candidate Portal - Migration Plan

## Project Overview

This document provides complete guidance for migrating the **Candidate Dashboard** (`/candidate/*` routes) from the old monolithic frontend to a new, standalone React application. **Read UPDATES.md alongside this document** to understand what has already been done and learn from past solutions.

---

## Executive Summary

### What is This Project?
The **HRM8 Candidate Portal** is a standalone application extracted from the monolithic `hrm8/frontend`. It provides:
- **Job Search & Discovery** - Browse and search for available positions
- **Application Management** - Apply to jobs and track application status
- **Profile Management** - Manage qualifications, work history, and documents
- **Assessment Center** - Take assessments and skills tests
- **Interview Coordination** - View scheduled interviews and video interviews
- **Offer Management** - Review and respond to job offers
- **Messaging** - Communication with recruiters
- **Notifications** - Real-time updates on application progress

### Why Separate Application?
- **Performance**: Faster load times with focused codebase
- **User Experience**: Candidate-specific UI/UX without HR management clutter
- **Deployment**: Independent deployment cycles
- **Maintenance**: Easier to maintain and evolve
- **Scalability**: Can scale independently based on candidate traffic

---

## Directory Structure

### Old Codebase (Reference - DO NOT MODIFY)
```
/hrm8/frontend/src/
├── pages/candidate/                 # All candidate pages (30+ files)
│   ├── CandidateDashboardHome.tsx  # Dashboard home
│   ├── JobSearchPage.tsx           # Job search/browse
│   ├── JobDetailPage.tsx           # Job details
│   ├── ApplicationsPage.tsx        # Application list
│   ├── ApplicationDetailPage.tsx   # Application details
│   ├── AssessmentListPage.tsx      # Assessments
│   ├── AssessmentPage.tsx          # Take assessment
│   ├── ProfilePage.tsx             # Candidate profile
│   ├── DocumentsPage.tsx           # Document management
│   ├── MessagesPage.tsx            # Messaging
│   ├── NotificationsPage.tsx       # Notifications
│   ├── SavedJobsPage.tsx           # Saved/bookmarked jobs
│   ├── OfferDetailPage.tsx         # Job offers
│   ├── Login.tsx / Register.tsx    # Auth pages
│   └── ... (20+ more files)
├── components/                     # Shared components used by candidate
├── lib/                            # Utilities and API services
├── types/                          # TypeScript types
└── services/                       # API clients
```

### New Codebase (Active Development - CREATE HERE)
```
/hrm8-candidate/
├── src/
│   ├── app/                        # App configuration
│   │   ├── layouts/                # Candidate-specific layouts
│   │   │   ├── CandidateLayout.tsx     # Main layout with navbar
│   │   │   └── AuthLayout.tsx          # Login/Register layout
│   │   ├── routes.tsx              # Route definitions
│   │   └── App.tsx                 # Root component
│   ├── modules/                    # Feature modules
│   │   ├── auth/                   # Authentication (login, register, verify)
│   │   ├── dashboard/              # Dashboard home
│   │   ├── jobs/                   # Job search & discovery
│   │   │   ├── components/         # JobCard, JobFilters, etc.
│   │   │   ├── hooks/              # useJobs, useJobDetail
│   │   │   └── services.ts         # Job API calls
│   │   ├── applications/           # Application management
│   │   │   ├── components/         # ApplicationCard, StatusBadge
│   │   │   ├── hooks/              # useApplications, useApply
│   │   │   └── services.ts         # Application API calls
│   │   ├── profile/                # Candidate profile
│   │   │   ├── components/         # ProfileForm, QualificationsForm
│   │   │   ├── hooks/              # useProfile, useWorkHistory
│   │   │   └── services.ts         # Profile API calls
│   │   ├── assessments/            # Assessment center
│   │   ├── interviews/             # Interview scheduling
│   │   ├── offers/                 # Offer management
│   │   ├── messages/               # Messaging
│   │   ├── notifications/          # Notifications
│   │   └── documents/              # Document management
│   ├── shared/                     # Shared across modules
│   │   ├── components/             # UI & common components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   └── common/             # CandidateCard, SearchBar, etc.
│   │   ├── hooks/                  # Shared hooks
│   │   ├── services/               # API client & base services
│   │   ├── types/                  # Shared types
│   │   └── lib/                    # Utilities
│   ├── pages/                      # Route entry points
│   │   ├── HomePage.tsx            # Dashboard home
│   │   ├── jobs/                   # Job-related pages
│   │   ├── applications/           # Application pages
│   │   ├── profile/                # Profile pages
│   │   └── ...                     # Other page groups
│   ├── contexts/                   # React contexts
│   └── assets/                     # Static assets
├── public/                         # Public assets
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── PLAN.md                         # This file
├── UPDATES.md                      # Progress tracker
└── README.md                       # Project documentation
```

---

## Tech Stack

### Frontend Framework
- **React 18** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Icon library

### State Management
- **React Query (TanStack Query)** - Server state management
- **Zustand** - Simple client state management
- **React Context** - Auth state, theme, etc.

### Forms & Validation
- **React Hook Form** - Performant forms
- **Zod** - Schema validation
- **Date-fns** - Date utilities

### Routing
- **React Router v6** - Client-side routing with lazy loading

### Communication
- **Axios** - HTTP client
- **Socket.io** - Real-time messaging (optional)

---

## Candidate Portal Features

### 1. Authentication Module
**Routes:** `/login`, `/register`, `/verify-email`, `/forgot-password`

**Pages:**
- Login - Email/password authentication
- Register - Candidate registration with email verification
- Verify Email - Email verification page
- Forgot Password - Password reset flow

**API Endpoints:**
- POST `/api/auth/candidate/login`
- POST `/api/auth/candidate/register`
- POST `/api/auth/candidate/verify-email`
- POST `/api/auth/candidate/forgot-password`
- POST `/api/auth/candidate/reset-password`

### 2. Dashboard Module
**Route:** `/` (home)

**Features:**
- Application statistics (applied, in-progress, rejected, offers)
- Upcoming interviews
- Recent activity
- Saved jobs preview
- Profile completion indicator
- Quick actions (search jobs, apply, etc.)

**API Endpoints:**
- GET `/api/candidate/dashboard/stats`
- GET `/api/candidate/dashboard/upcoming-interviews`
- GET `/api/candidate/dashboard/recent-activity`

### 3. Jobs Module
**Routes:** `/jobs`, `/jobs/:id`, `/jobs/:id/apply`

**Pages:**
- Job Search - Search and filter jobs
- Job Detail - Full job description and details
- Apply Page - Job application form
- Saved Jobs - Bookmarked jobs

**Features:**
- Advanced search filters (location, salary, type, etc.)
- Job recommendations
- Save/bookmark jobs
- Share jobs
- Similar jobs suggestions
- Company profiles

**API Endpoints:**
- GET `/api/public/jobs` - Public job listings
- GET `/api/public/jobs/:id` - Job details
- POST `/api/candidate/jobs/:id/apply` - Submit application
- POST `/api/candidate/jobs/:id/save` - Save job
- DELETE `/api/candidate/jobs/:id/unsave` - Unsave job
- GET `/api/candidate/jobs/saved` - Get saved jobs
- GET `/api/public/companies/:id` - Company details

### 4. Applications Module
**Routes:** `/applications`, `/applications/:id`

**Pages:**
- Applications List - All applications with status
- Application Detail - Single application tracking
- Application Confirmation - Success page after applying

**Features:**
- Application status tracking
- Timeline view of application progress
- Withdraw application
- Update application
- Upload additional documents

**API Endpoints:**
- GET `/api/candidate/applications` - Get all applications
- GET `/api/candidate/applications/:id` - Get application details
- PUT `/api/candidate/applications/:id` - Update application
- DELETE `/api/candidate/applications/:id` - Withdraw application
- POST `/api/candidate/applications/:id/documents` - Upload document

### 5. Profile Module
**Routes:** `/profile`, `/profile/edit`, `/profile/qualifications`, `/profile/work-history`

**Pages:**
- Profile View - Public-facing profile
- Profile Edit - Edit basic information
- Qualifications - Education, certifications, skills
- Work History - Employment history
- Documents - Resume, certifications, etc.

**Features:**
- Profile completeness indicator
- Resume builder
- Skills endorsement
- LinkedIn import (future)
- Portfolio/work samples

**API Endpoints:**
- GET `/api/candidate/profile` - Get profile
- PUT `/api/candidate/profile` - Update profile
- POST `/api/candidate/profile/resume` - Upload resume
- GET `/api/candidate/profile/qualifications` - Get qualifications
- POST `/api/candidate/profile/qualifications` - Add qualification
- PUT `/api/candidate/profile/qualifications/:id` - Update qualification
- DELETE `/api/candidate/profile/qualifications/:id` - Delete qualification
- GET `/api/candidate/profile/work-history` - Get work history
- POST `/api/candidate/profile/work-history` - Add work experience
- PUT `/api/candidate/profile/work-history/:id` - Update experience
- DELETE `/api/candidate/profile/work-history/:id` - Delete experience

### 6. Assessments Module
**Routes:** `/assessments`, `/assessments/:id`

**Pages:**
- Assessment List - Available and completed assessments
- Assessment Page - Take assessment

**Features:**
- Skills assessments
- Personality tests
- Cognitive tests
- Timed assessments
- Progress tracking
- Results viewing

**API Endpoints:**
- GET `/api/candidate/assessments` - Get all assessments
- GET `/api/candidate/assessments/:id` - Get assessment details
- POST `/api/candidate/assessments/:id/start` - Start assessment
- POST `/api/candidate/assessments/:id/submit` - Submit answers
- GET `/api/candidate/assessments/:id/results` - Get results

### 7. Interviews Module
**Routes:** `/interviews`, `/interviews/:id`

**Features:**
- Upcoming interviews calendar
- Interview preparation resources
- Video interview links
- Reschedule requests
- Interview feedback (post-interview)

**API Endpoints:**
- GET `/api/candidate/interviews` - Get all interviews
- GET `/api/candidate/interviews/:id` - Get interview details
- POST `/api/candidate/interviews/:id/reschedule` - Request reschedule
- POST `/api/candidate/interviews/:id/confirm` - Confirm attendance
- GET `/api/candidate/interviews/:id/join` - Get video meeting link

### 8. Offers Module
**Routes:** `/offers`, `/offers/:id`

**Features:**
- View job offers
- Accept/decline offers
- Negotiate terms
- Upload required documents
- Track offer expiration

**API Endpoints:**
- GET `/api/candidate/offers` - Get all offers
- GET `/api/candidate/offers/:id` - Get offer details
- POST `/api/candidate/offers/:id/accept` - Accept offer
- POST `/api/candidate/offers/:id/decline` - Decline offer
- POST `/api/candidate/offers/:id/negotiate` - Negotiate terms
- POST `/api/candidate/offers/:id/documents` - Upload required documents

### 9. Messages Module
**Routes:** `/messages`, `/messages/:id`

**Features:**
- Inbox/sent messages
- Conversation threads
- Message recruiters
- File attachments
- Real-time notifications

**API Endpoints:**
- GET `/api/candidate/messages` - Get all messages
- GET `/api/candidate/messages/:id` - Get conversation
- POST `/api/candidate/messages` - Send message
- PUT `/api/candidate/messages/:id/read` - Mark as read

### 10. Notifications Module
**Route:** `/notifications`

**Features:**
- Application status updates
- Interview reminders
- New job recommendations
- Message notifications
- Offer updates

**API Endpoints:**
- GET `/api/candidate/notifications` - Get notifications
- PUT `/api/candidate/notifications/:id/read` - Mark as read
- PUT `/api/candidate/notifications/read-all` - Mark all as read

### 11. Documents Module
**Route:** `/documents`

**Features:**
- Upload resume
- Upload certifications
- Upload portfolio samples
- Document verification status
- Document management

**API Endpoints:**
- GET `/api/candidate/documents` - Get all documents
- POST `/api/candidate/documents` - Upload document
- DELETE `/api/candidate/documents/:id` - Delete document

### 12. Settings Module
**Route:** `/settings`

**Features:**
- Account settings
- Notification preferences
- Privacy settings
- Email preferences
- Delete account

**API Endpoints:**
- GET `/api/candidate/settings` - Get settings
- PUT `/api/candidate/settings` - Update settings
- POST `/api/candidate/settings/change-password` - Change password
- DELETE `/api/candidate/account` - Delete account

---

## Migration Process: Step-by-Step Guide

### Phase 0: Project Setup ✅ CRITICAL
**Goal:** Create new React app with proper configuration

**Steps:**
1. **Initialize Vite + React + TypeScript Project**
   ```bash
   cd /hrm8-candidate
   npm create vite@latest . -- --template react-ts
   ```

2. **Install Core Dependencies**
   ```bash
   npm install react-router-dom@6 @tanstack/react-query axios zustand
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Install UI Dependencies**
   ```bash
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
   npm install lucide-react clsx tailwind-merge
   npm install react-hook-form zod @hookform/resolvers
   npm install date-fns
   ```

4. **Setup shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```

5. **Configure Path Aliases** (tsconfig.json & vite.config.ts)
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@/app/*": ["./src/app/*"],
         "@/modules/*": ["./src/modules/*"],
         "@/shared/*": ["./src/shared/*"],
         "@/pages/*": ["./src/pages/*"],
         "@/contexts/*": ["./src/contexts/*"],
         "@/assets/*": ["./src/assets/*"]
       }
     }
   }
   ```

6. **Create Directory Structure**
   ```bash
   mkdir -p src/{app/{layouts,providers},modules,shared/{components/{ui,common},hooks,services,types,lib},pages,contexts,assets}
   ```

7. **Setup Environment Variables**
   - Create `.env.example` with API URL, etc.
   - Add `.env` to `.gitignore`

8. **Configure Tailwind**
   - Update `tailwind.config.ts` with custom colors, fonts
   - Import Tailwind in `src/index.css`

### Phase 1: Shared Foundation Layer
**Goal:** Extract shared components, utilities, and services

**Steps:**

1. **Copy UI Components from Old Codebase**
   ```bash
   # Copy shadcn/ui components
   cp -r /hrm8/frontend/src/components/ui /hrm8-candidate/src/shared/components/ui
   ```

2. **Copy Common Components**
   - Search bar
   - Cards (JobCard, ApplicationCard, etc.)
   - Badges (StatusBadge, PriorityBadge)
   - Empty states
   - Loading skeletons
   - Modals/dialogs
   - Toast notifications

3. **Create API Client**
   ```typescript
   // src/shared/services/api-client.ts
   import axios from 'axios';

   const apiClient = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     headers: { 'Content-Type': 'application/json' }
   });

   // Add auth token interceptor
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('candidate_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export default apiClient;
   ```

4. **Create Auth Context**
   ```typescript
   // src/contexts/AuthContext.tsx
   interface AuthContextType {
     user: Candidate | null;
     login: (email: string, password: string) => Promise<void>;
     logout: () => void;
     register: (data: RegisterData) => Promise<void>;
     isAuthenticated: boolean;
     isLoading: boolean;
   }
   ```

5. **Copy Shared Types**
   ```typescript
   // src/shared/types/index.ts
   export interface Candidate {
     id: string;
     email: string;
     name: string;
     // ... other fields
   }

   export interface Job {
     id: string;
     title: string;
     company: Company;
     // ... other fields
   }

   // ... more types
   ```

6. **Copy Utility Functions**
   - Date formatters
   - String utilities
   - Validation helpers
   - File upload utilities

### Phase 2: Authentication Module
**Goal:** Implement login, register, and auth flow

**Steps:**

1. **Create Auth Module Structure**
   ```
   modules/auth/
   ├── components/
   │   ├── LoginForm.tsx
   │   ├── RegisterForm.tsx
   │   └── VerifyEmailForm.tsx
   ├── hooks/
   │   └── useAuth.ts
   ├── services.ts
   └── types.ts
   ```

2. **Copy Auth Pages from Old Codebase**
   - Login.tsx → pages/auth/LoginPage.tsx
   - Register.tsx → pages/auth/RegisterPage.tsx
   - VerifyEmail.tsx → pages/auth/VerifyEmailPage.tsx

3. **Fix Import Paths**
   ```bash
   # Use sed to update imports
   sed -i '' 's|@/components/|@/shared/components/|g' src/pages/auth/*.tsx
   sed -i '' 's|@/lib/|@/shared/lib/|g' src/pages/auth/*.tsx
   ```

4. **Implement Auth Service**
   ```typescript
   // modules/auth/services.ts
   import apiClient from '@/shared/services/api-client';

   export const authService = {
     login: async (email: string, password: string) => {
       const { data } = await apiClient.post('/api/auth/candidate/login', { email, password });
       return data;
     },
     register: async (userData: RegisterData) => {
       const { data } = await apiClient.post('/api/auth/candidate/register', userData);
       return data;
     },
     // ... more methods
   };
   ```

5. **Setup Protected Routes**
   ```typescript
   // app/ProtectedRoute.tsx
   const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
     const { isAuthenticated } = useAuth();
     return isAuthenticated ? children : <Navigate to="/login" />;
   };
   ```

### Phase 3: Dashboard Module
**Goal:** Create candidate dashboard home page

**Steps:**

1. **Copy Dashboard Home**
   - CandidateDashboardHome.tsx → pages/HomePage.tsx

2. **Create Dashboard Components**
   - StatsCards (applications count, interviews, etc.)
   - UpcomingInterviews widget
   - RecentActivity widget
   - SavedJobs widget
   - ProfileCompletion indicator

3. **Implement Dashboard Service**
   ```typescript
   // modules/dashboard/services.ts
   export const dashboardService = {
     getStats: () => apiClient.get('/api/candidate/dashboard/stats'),
     getUpcomingInterviews: () => apiClient.get('/api/candidate/dashboard/upcoming-interviews'),
     getRecentActivity: () => apiClient.get('/api/candidate/dashboard/recent-activity'),
   };
   ```

### Phase 4-12: Feature Modules
**Goal:** Migrate remaining modules one by one

**Pattern for Each Module:**

1. Create module structure
2. Copy pages from old codebase
3. Extract components into module/components
4. Fix import paths
5. Create service layer
6. Create custom hooks
7. Add routes to routes.tsx
8. Test functionality
9. Update UPDATES.md

**Module Migration Order:**

1. ✅ **Auth** (Phase 2)
2. ✅ **Dashboard** (Phase 3)
3. 🔄 **Jobs** (Search, Detail, Apply) - HIGH PRIORITY
4. 🔄 **Applications** (List, Detail, Tracking) - HIGH PRIORITY
5. 🔄 **Profile** (View, Edit, Qualifications, Work History) - HIGH PRIORITY
6. ⏳ **Assessments** (List, Take Assessment)
7. ⏳ **Interviews** (List, Detail, Join)
8. ⏳ **Offers** (List, Detail, Accept/Decline)
9. ⏳ **Messages** (Inbox, Conversation)
10. ⏳ **Notifications**
11. ⏳ **Documents**
12. ⏳ **Settings**

---

## Import Path Mapping

### Old Frontend → New Candidate Frontend

**CRITICAL: All imports must be updated when copying code!**

| Old Import Path | New Import Path | Notes |
|----------------|-----------------|-------|
| `@/components/` | `@/shared/components/` | Shared UI components |
| `@/hooks/` | `@/shared/hooks/` | Custom React hooks |
| `@/lib/` | `@/shared/lib/` | Utilities and helpers |
| `@/types/` | `@/shared/types/` | TypeScript types |
| `@/services/` | `@/shared/services/` | API service clients |
| `@/data/` | `@/shared/data/` | Mock data, constants |
| `@/contexts/` | `@/contexts/` | React contexts |
| N/A | `@/app/` | App-level code (layouts, routes) |
| N/A | `@/modules/` | Feature-specific modules |
| N/A | `@/pages/` | Page components |

**Automated Fix Command:**
```bash
# After copying a file from old to new, run:
find src/pages -name "*.tsx" -exec \
  sed -i '' \
    -e 's|@/components/|@/shared/components/|g' \
    -e 's|@/hooks/|@/shared/hooks/|g' \
    -e 's|@/lib/|@/shared/lib/|g' \
    -e 's|@/types/|@/shared/types/|g' \
    -e 's|@/services/|@/shared/services/|g' \
    -e 's|@/data/|@/shared/data/|g' \
  {} +
```

---

## Backend API Integration

### Authentication
All candidate routes require authentication via JWT token.

**Auth Flow:**
1. User logs in → Backend returns JWT token
2. Store token in `localStorage` as `candidate_token`
3. Add token to all API requests via Authorization header
4. On 401 response → Redirect to login

### API Base URL
```env
VITE_API_URL=http://localhost:3000
```

### Response Format
Backend uses consistent response format:
```json
{
  "success": true,
  "data": { ... }
}
```

Or on error:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Candidate-Specific Endpoints
All candidate endpoints are prefixed with `/api/candidate/`:
- `/api/candidate/profile`
- `/api/candidate/applications`
- `/api/candidate/assessments`
- etc.

Public endpoints (no auth required):
- `/api/public/jobs`
- `/api/public/companies`

---

## Testing Strategy

### 1. Unit Tests (Optional)
- Test utility functions
- Test custom hooks
- Test API service methods

### 2. Integration Tests (Optional)
- Test full user flows
- Test API integration

### 3. Manual Testing (Required)
For each feature, test:
- ✅ Page loads without errors
- ✅ Data displays correctly
- ✅ Forms submit successfully
- ✅ Validation works
- ✅ Error handling works
- ✅ Loading states work
- ✅ Responsive design
- ✅ Navigation works

---

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
# Production
VITE_API_URL=https://api.hrm8.com
VITE_APP_ENV=production
```

### Hosting Options
- **Vercel** - Recommended for Vite apps
- **Netlify** - Alternative option
- **AWS S3 + CloudFront** - For full control
- **Custom Server** - Nginx serving static files

---

## Common Issues and Solutions

### Issue 1: Import Path Errors

**Diagnosis:**
```
Failed to resolve import "@/components/ui/button"
```

**Solution:**
1. Check the import path
2. Update to new modular path: `@/shared/components/ui/button`
3. Verify file exists at that location
4. Check `vite.config.ts` and `tsconfig.json` for path aliases

### Issue 2: Authentication Not Working

**Diagnosis:**
- User can't login
- Token not being sent

**Solution:**
1. Check token is stored: `localStorage.getItem('candidate_token')`
2. Check API client interceptor is adding Authorization header
3. Check backend endpoint: `/api/auth/candidate/login`
4. Check CORS settings on backend

### Issue 3: API Calls Failing

**Diagnosis:**
- 404 errors
- 500 errors
- CORS errors

**Solution:**
1. Check API URL in `.env` file
2. Check backend is running
3. Check endpoint exists in backend
4. Check request payload format
5. Check CORS settings

### Issue 4: Component Not Found

**Diagnosis:**
```
Module not found: Can't resolve '@/components/JobCard'
```

**Solution:**
1. Search in new frontend: `find src -name "JobCard*"`
2. If not found, search in old: `find ../hrm8/frontend/src -name "JobCard*"`
3. Copy to appropriate location in new structure
4. Fix import paths in the copied file
5. Update import in the file that's trying to use it

---

## Working with AI Agents

### What to Provide to AI
When asking AI to help with migration:
1. **This PLAN.md file** (for context)
2. **UPDATES.md file** (for past solutions)
3. **The specific feature/page to migrate**
4. **Which phase you're in**

### What AI Should Do
The AI agent should automatically:
1. Read PLAN.md and UPDATES.md first
2. Search for the feature in old codebase (`/hrm8/frontend/src/pages/candidate/`)
3. Copy to new location with correct structure
4. Fix all import paths automatically
5. Create necessary service layer
6. Create custom hooks if needed
7. Add routes to routes.tsx
8. Update UPDATES.md with the work done
9. Test the feature

### AI Guidelines

**DO:**
- Search old codebase for working implementation
- Copy entire pages/components with all dependencies
- Fix import paths automatically using sed commands
- Create service layer for API calls
- Use React Query for data fetching
- Follow modular architecture pattern
- Update UPDATES.md after completing work

**DON'T:**
- Copy code without fixing imports
- Create new implementations when old one exists
- Modify old codebase
- Skip creating service layer
- Hardcode API URLs (use env variables)

---

## Progress Tracking

### Completion Checklist

**Phase 0: Project Setup**
- [ ] Initialize Vite + React + TypeScript
- [ ] Install all dependencies
- [ ] Setup Tailwind CSS
- [ ] Setup shadcn/ui
- [ ] Configure path aliases
- [ ] Create directory structure
- [ ] Setup environment variables
- [ ] Create basic layouts

**Phase 1: Shared Foundation**
- [ ] Copy UI components (shadcn/ui)
- [ ] Copy common components
- [ ] Create API client
- [ ] Create Auth context
- [ ] Copy shared types
- [ ] Copy utility functions
- [ ] Setup React Query
- [ ] Setup routing

**Phase 2: Authentication**
- [ ] Login page
- [ ] Register page
- [ ] Verify email page
- [ ] Forgot password
- [ ] Auth service
- [ ] Protected routes
- [ ] Auth context implementation

**Phase 3: Dashboard**
- [ ] Dashboard home page
- [ ] Stats cards
- [ ] Upcoming interviews widget
- [ ] Recent activity widget
- [ ] Saved jobs widget
- [ ] Profile completion indicator

**Phase 4: Jobs Module**
- [ ] Job search page
- [ ] Job detail page
- [ ] Apply page
- [ ] Saved jobs page
- [ ] Job filters
- [ ] Job service
- [ ] Job hooks

**Phase 5: Applications Module**
- [ ] Applications list page
- [ ] Application detail page
- [ ] Application confirmation page
- [ ] Application tracking
- [ ] Application service
- [ ] Application hooks

**Phase 6: Profile Module**
- [ ] Profile view page
- [ ] Profile edit page
- [ ] Qualifications page
- [ ] Work history page
- [ ] Profile service
- [ ] Profile hooks

**Phase 7-12: Remaining Modules**
- [ ] Assessments module
- [ ] Interviews module
- [ ] Offers module
- [ ] Messages module
- [ ] Notifications module
- [ ] Documents module
- [ ] Settings module

---

## File Count Estimate

Based on old frontend analysis:
- **Pages:** ~30 pages in `/pages/candidate/`
- **Components:** ~50 shared components to copy
- **UI Components:** ~25 shadcn/ui components
- **Services:** ~12 service files
- **Types:** ~15 type definition files
- **Hooks:** ~20 custom hooks
- **Total Files:** ~150 files (significantly smaller than hrm8-ats due to focused scope)

---

## Timeline Estimate

**Realistic Timeline:**
- **Phase 0 (Setup):** 1 day
- **Phase 1 (Foundation):** 2-3 days
- **Phase 2 (Auth):** 1-2 days
- **Phase 3 (Dashboard):** 1 day
- **Phase 4 (Jobs):** 2-3 days
- **Phase 5 (Applications):** 2-3 days
- **Phase 6 (Profile):** 2-3 days
- **Phase 7-12 (Remaining):** 5-7 days
- **Testing & Bug Fixes:** 2-3 days
- **Total:** 3-4 weeks

**With AI Assistance:** 2-3 weeks

---

## Success Criteria

✅ **Project is successful when:**

1. All candidate pages migrated and functional
2. Authentication working (login, register, logout)
3. All API integrations working
4. Responsive design on mobile, tablet, desktop
5. No console errors
6. Fast load times (< 2 seconds)
7. Smooth navigation (no full page reloads)
8. All forms working with validation
9. File uploads working
10. Real-time features working (messages, notifications)

---

## Maintenance

After migration is complete:

### Regular Tasks
- Update dependencies monthly
- Monitor for security vulnerabilities
- Review and optimize bundle size
- Check for console errors in production
- Monitor API response times

### Documentation
- Keep README.md updated
- Update UPDATES.md for any significant changes
- Document any new patterns or conventions

---

## Conclusion

This plan provides a complete roadmap for migrating the candidate dashboard to a standalone React application. By following these guidelines:

- Any developer/AI can understand the project structure
- Migration is systematic and repeatable
- Code quality remains high
- The new architecture benefits are preserved

**Remember:** Check UPDATES.md before starting new work to see what's already been done!

---

## Quick Start for AI Agents

When starting work on this project:

1. ✅ Read this PLAN.md completely
2. ✅ Read UPDATES.md to see current progress
3. ✅ Identify which phase you're in
4. ✅ Locate feature in old codebase: `/hrm8/frontend/src/pages/candidate/`
5. ✅ Copy to new location with correct structure
6. ✅ Fix import paths using sed commands
7. ✅ Create service layer and hooks
8. ✅ Add routes to routes.tsx
9. ✅ Test functionality
10. ✅ Update UPDATES.md with your work
