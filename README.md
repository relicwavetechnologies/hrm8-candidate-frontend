# 🎯 HRM8 Candidate Portal

> **A standalone candidate experience platform extracted from the monolithic HRM8 frontend**

![Status](https://img.shields.io/badge/Status-Not_Started-red)
![Progress](https://img.shields.io/badge/Progress-0%25-red)
![Phase](https://img.shields.io/badge/Phase-Setup-orange)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Migration Status](#migration-status)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Development](#development)

---

## 🌟 Overview

The **HRM8 Candidate Portal** is a modern, focused web application that provides job seekers with a seamless experience for finding jobs, managing applications, and communicating with employers.

### Why a Separate App?

**Problem:** The monolithic `hrm8/frontend` contained 6 different dashboards (HR, Candidate, Admin, Consultant, Sales, Consultant360) in a single React app, causing:
- Slow load times
- Complex maintenance
- Difficulty in scaling individual features
- Confusing navigation

**Solution:** Extract each dashboard into focused, standalone applications:
1. ✅ **HRM8-ATS** - HR & Recruitment Management (DONE)
2. 🔄 **HRM8-Candidate** - Candidate Portal (THIS PROJECT)
3. ⏳ **HRM8-Admin-Staff** - Admin & Staff Management (NEXT)

### Benefits
- ⚡ **Faster:** Smaller bundle, faster load times
- 🎨 **Better UX:** Candidate-focused design
- 🚀 **Independent Deployment:** Deploy updates without affecting other portals
- 🔧 **Easier Maintenance:** Smaller codebase, easier to understand
- 📈 **Scalable:** Can scale independently based on traffic

### 🔄 Working with Old and New Codebases

**Important:** This migration involves working with **two codebases in the same workspace**:

```
/hrm8-new/
├── hrm8/frontend/          ← OLD FRONTEND (reference only, DO NOT MODIFY)
└── hrm8-candidate/         ← NEW FRONTEND (active development, MODIFY HERE)
```

**Migration Workflow:**
1. **Find** feature in old codebase: `/hrm8/frontend/src/pages/candidate/`
2. **Copy** to new codebase: `/hrm8-candidate/src/pages/`
3. **Fix** import paths automatically
4. **Extract** components into modules
5. **Create** service layer and hooks
6. **Add** routes to `routes.tsx`
7. **Test** functionality
8. **Update** this README and UPDATES.md

**For AI Agents:** You'll be pulling code from the old repo and migrating it to the new structure. Always reference PLAN.md for correct migration patterns.

---

## 📊 Migration Status

> **Note for AI Agents:** Keep this section updated as you complete migration phases!

### Overall Progress: 0% (0/12 Phases Complete)

```
Phase 0: Project Setup              [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 1: Shared Foundation          [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 2: Authentication             [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 3: Dashboard                  [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 4: Jobs Module                [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 5: Applications Module        [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 6: Profile Module             [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 7: Assessments Module         [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 8: Interviews Module          [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 9: Offers Module              [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 10: Messages Module           [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 11: Notifications & Documents [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
Phase 12: Settings & Polish         [⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜] 0%
```

### Current Sprint

**Active Phase:** Phase 0 - Project Setup
**Started:** TBD
**Target Completion:** TBD

**Current Tasks:**
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies
- [ ] Setup Tailwind CSS and shadcn/ui
- [ ] Configure path aliases
- [ ] Create directory structure
- [ ] Setup environment variables

### Statistics

| Metric | Count |
|--------|-------|
| **Total Files to Migrate** | ~150 |
| **Files Migrated** | 0 |
| **Pages Migrated** | 0 / 30 |
| **Components Created** | 0 |
| **API Services Created** | 0 |
| **Hooks Created** | 0 |

---

## ✨ Features

### 🔐 Authentication
- Login & Registration
- Email verification
- Password reset
- JWT token authentication

### 🏠 Dashboard
- Application statistics
- Upcoming interviews
- Recent activity feed
- Saved jobs preview
- Profile completion indicator

### 💼 Job Search & Discovery
- Advanced search with filters
- Job recommendations
- Save/bookmark jobs
- Company profiles
- Similar jobs suggestions

### 📝 Application Management
- View all applications
- Track application status
- Application timeline
- Withdraw applications
- Upload additional documents

### 👤 Profile Management
- Complete candidate profile
- Resume upload & builder
- Education & qualifications
- Work history
- Skills & endorsements
- Portfolio/work samples

### 📊 Assessments
- Skills assessments
- Personality tests
- Cognitive tests
- Timed assessments
- View results

### 📅 Interviews
- Interview calendar
- Video interview links
- Reschedule requests
- Interview preparation resources

### 💰 Offers
- View job offers
- Accept/decline offers
- Negotiate terms
- Upload required documents

### 💬 Messaging
- Message recruiters
- Conversation threads
- File attachments
- Real-time notifications

### 🔔 Notifications
- Application updates
- Interview reminders
- New job recommendations
- Message notifications

### 📄 Documents
- Upload documents
- Resume management
- Certifications
- Portfolio samples

### ⚙️ Settings
- Account settings
- Notification preferences
- Privacy settings
- Change password

---

## 🛠️ Tech Stack

### Core
- **React 18** - UI library with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library

### State Management
- **React Query (TanStack Query)** - Server state & caching
- **Zustand** - Lightweight client state
- **React Context** - Auth & theme state

### Forms & Validation
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **Date-fns** - Date utilities

### Routing & Navigation
- **React Router v6** - Declarative routing with lazy loading

### HTTP & Real-time
- **Axios** - Promise-based HTTP client
- **Socket.io** - Real-time bidirectional communication (optional)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm
- **Backend API** running at `http://localhost:3000`

### Installation

```bash
# Clone the repository (if not already cloned)
git clone <repository-url>
cd hrm8-candidate

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your backend API URL
# VITE_API_URL=http://localhost:3000

# Start development server
pnpm dev
```

The application will be available at **`http://localhost:5173`**

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Building
pnpm build            # Production build
pnpm build:dev        # Development build with source maps
pnpm preview          # Preview production build locally

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm type-check       # TypeScript type checking
pnpm format           # Format code with Prettier
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Application
VITE_APP_NAME=HRM8 Candidate Portal
VITE_APP_ENV=development

# Feature Flags (optional)
VITE_ENABLE_MESSAGING=true
VITE_ENABLE_ASSESSMENTS=true
```

---

## 📁 Project Structure

> **Note:** Structure mirrors **hrm8-ats** for consistency

```
hrm8-candidate/
├── src/
│   ├── app/                        # App configuration & setup
│   │   ├── layouts/                # Layout components
│   │   │   ├── CandidateLayout.tsx # Main app layout
│   │   │   └── AuthLayout.tsx      # Auth pages layout
│   │   ├── providers/              # App-level providers
│   │   ├── routes.tsx              # Route definitions
│   │   └── App.tsx                 # Root component
│   │
│   ├── modules/                    # Feature modules (domain-driven)
│   │   ├── auth/                   # Authentication module
│   │   │   ├── components/         # Auth-specific components
│   │   │   ├── hooks/              # Auth hooks
│   │   │   ├── services.ts         # Auth API calls
│   │   │   └── types.ts            # Auth types
│   │   ├── dashboard/              # Dashboard module
│   │   ├── jobs/                   # Jobs module
│   │   ├── applications/           # Applications module
│   │   ├── profile/                # Profile module
│   │   ├── assessments/            # Assessments module
│   │   ├── interviews/             # Interviews module
│   │   ├── offers/                 # Offers module
│   │   ├── messages/               # Messages module
│   │   └── notifications/          # Notifications module
│   │
│   ├── shared/                     # Shared across modules (MATCHES hrm8-ats)
│   │   ├── components/             # Reusable components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── common/             # Common components (cards, badges, etc.)
│   │   │   ├── layouts/            # Layout utilities
│   │   │   └── dialogs/            # Dialog components
│   │   ├── hooks/                  # Shared hooks (useAuth, useDebounce, etc.)
│   │   ├── services/               # API client & base services
│   │   ├── types/                  # Shared TypeScript types
│   │   └── lib/                    # Utilities & helpers
│   │       ├── utils/              # General utilities
│   │       ├── validations/        # Form validations
│   │       └── api/                # API service functions
│   │
│   ├── pages/                      # Route entry points
│   │   ├── auth/                   # Auth pages
│   │   ├── jobs/                   # Job pages
│   │   ├── applications/           # Application pages
│   │   ├── profile/                # Profile pages
│   │   └── HomePage.tsx            # Dashboard home
│   │
│   ├── contexts/                   # React contexts
│   │   ├── AuthContext.tsx         # Auth state
│   │   └── ThemeContext.tsx        # Theme state
│   │
│   ├── config/                     # Configuration files
│   │   └── dashboardConfigs.ts     # Dashboard configs
│   │
│   ├── utils/                      # App-level utilities
│   ├── assets/                     # Static assets
│   ├── main.tsx                    # App entry point
│   └── index.css                   # Global styles
│
├── public/                         # Public assets
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
│
├── PLAN.md                         # 📖 Complete migration plan
├── UPDATES.md                      # 📝 Progress tracker (keep updated!)
└── README.md                       # 📋 This file (keep updated!)
```

### Module Structure

Each feature module follows this consistent structure (same as hrm8-ats):

```
modules/[feature]/
├── components/          # Feature-specific UI components
├── hooks/              # Feature-specific custom hooks
├── services.ts         # API calls for this feature
├── types.ts            # TypeScript types/interfaces
└── index.ts            # Public exports
```

### Copying from Old Frontend

When copying from `/hrm8/frontend/src/pages/candidate/`:

**OLD structure:**
```
hrm8/frontend/src/
├── pages/candidate/     ← Copy from here
├── components/          ← Reference for components
├── lib/                 ← Reference for utilities
└── types/               ← Reference for types
```

**NEW structure:**
```
hrm8-candidate/src/
├── pages/               ← Copy pages here
├── modules/[feature]/   ← Extract feature logic here
├── shared/components/   ← Move shared components here
└── shared/lib/          ← Move utilities here
```

---

## 📚 Documentation

### Essential Docs

| Document | Description |
|----------|-------------|
| **PLAN.md** | Complete migration strategy with step-by-step guide |
| **UPDATES.md** | Detailed progress tracker with implementation notes |
| **README.md** | This file - project overview and quick start |

### For Developers

- **PLAN.md** - Read this first to understand the complete migration strategy
- **UPDATES.md** - Check this to see what's already been done
- **Import Path Guide** - See PLAN.md section "Import Path Mapping"
- **API Integration** - See PLAN.md section "Backend API Integration"

### For AI Agents

When working on this project, you'll be migrating code from `/hrm8/frontend/` to `/hrm8-candidate/`:

#### Pre-Work Checklist
1. ✅ **Read PLAN.md** completely to understand the architecture
2. ✅ **Check UPDATES.md** to see current progress and avoid duplicate work
3. ✅ **Review hrm8-ats structure** as a reference (similar patterns)
4. ✅ **Identify source files** in `/hrm8/frontend/src/pages/candidate/`

#### Migration Workflow
1. **FIND** the feature in old codebase
   ```bash
   # Example: Find job search page
   find ../hrm8/frontend/src/pages/candidate -name "*Job*"
   ```

2. **COPY** to new location
   ```bash
   # Example: Copy JobSearchPage.tsx
   cp ../hrm8/frontend/src/pages/candidate/JobSearchPage.tsx \
      src/pages/jobs/SearchPage.tsx
   ```

3. **FIX** import paths
   ```bash
   # Use sed to update imports
   sed -i '' 's|@/components/|@/shared/components/|g' src/pages/jobs/SearchPage.tsx
   ```

4. **EXTRACT** components to modules
   - Move JobCard to `modules/jobs/components/`
   - Move job-related logic to `modules/jobs/`

5. **CREATE** services and hooks
   - Create `modules/jobs/services.ts`
   - Create `modules/jobs/hooks/useJobs.ts`

6. **ADD** routes to `app/routes.tsx`

7. **TEST** functionality thoroughly

#### Post-Work Checklist
1. ✅ **Update this README** after completing each phase:
   - Update progress bars (replace ⬜ with ✅)
   - Update statistics (files migrated, pages count)
   - Update current sprint section
   - Update "Last Updated" timestamp
2. ✅ **Update UPDATES.md** with detailed implementation notes:
   - What was migrated
   - Files created/modified
   - Issues encountered and solutions
   - Patterns established
3. ✅ **Follow the exact structure** from hrm8-ats for consistency

#### Important Notes
- ⚠️ **DO NOT modify** `/hrm8/frontend/` - it's reference only
- ✅ **DO modify** `/hrm8-candidate/` - active development
- 📝 **KEEP documentation updated** - README and UPDATES.md
- 🔍 **REFERENCE hrm8-ats** for similar patterns

---

## 💻 Development

### Development Workflow

1. **Start Backend** (in separate terminal)
   ```bash
   cd ../backend-template
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   pnpm dev
   ```

3. **Make Changes**
   - Follow the modular architecture
   - Use path aliases (`@/shared/*`, `@/modules/*`)
   - Create components in appropriate modules
   - Write TypeScript types
   - Use React Query for data fetching

4. **Test Changes**
   - Check browser console for errors
   - Test responsive design
   - Verify API calls in Network tab
   - Test all user flows

### Code Style Guidelines

#### Naming Conventions
- **Components:** PascalCase (`JobCard.tsx`)
- **Hooks:** camelCase with 'use' prefix (`useJobs.ts`)
- **Services:** camelCase (`jobService.ts`)
- **Types:** PascalCase (`JobType`, `CandidateProfile`)
- **Files:** Match main export

#### Import Order
```typescript
// 1. React & external libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules
import { JobCard } from '@/modules/jobs';

// 3. Shared components
import { Button } from '@/shared/components/ui';

// 4. Shared utilities
import { cn } from '@/shared/lib/utils';

// 5. Types
import type { Job } from '@/shared/types';

// 6. Relative imports
import { JobFilters } from './JobFilters';
```

#### Component Structure
```typescript
// Props interface
interface JobCardProps {
  job: Job;
  onApply: (jobId: string) => void;
}

// Component
export function JobCard({ job, onApply }: JobCardProps) {
  // Hooks first
  const [isSaved, setIsSaved] = useState(false);

  // Event handlers
  const handleApply = () => {
    onApply(job.id);
  };

  // Render
  return (
    <div className="job-card">
      {/* JSX */}
    </div>
  );
}
```

### Path Aliases

Use these path aliases for clean imports:

| Alias | Maps To | Usage |
|-------|---------|-------|
| `@/*` | `./src/*` | Any file in src |
| `@/app/*` | `./src/app/*` | App config & layouts |
| `@/modules/*` | `./src/modules/*` | Feature modules |
| `@/shared/*` | `./src/shared/*` | Shared code |
| `@/pages/*` | `./src/pages/*` | Page components |
| `@/contexts/*` | `./src/contexts/*` | React contexts |

Example:
```typescript
// ✅ Good
import { Button } from '@/shared/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { JobCard } from '@/modules/jobs';

// ❌ Bad
import { Button } from '../../shared/components/ui';
import { useAuth } from '../../../contexts/AuthContext';
```

### API Integration

All API calls go through the centralized API client:

```typescript
// src/shared/services/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Auth interceptor adds JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('candidate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

Usage in modules:
```typescript
// modules/jobs/services.ts
import apiClient from '@/shared/services/api-client';

export const jobService = {
  getJobs: async (filters: JobFilters) => {
    const { data } = await apiClient.get('/api/public/jobs', { params: filters });
    return data;
  },

  getJobById: async (id: string) => {
    const { data } = await apiClient.get(`/api/public/jobs/${id}`);
    return data;
  },
};
```

### State Management

Use appropriate state management for each use case:

#### Server State (API data)
Use React Query:
```typescript
import { useQuery } from '@tanstack/react-query';
import { jobService } from '@/modules/jobs/services';

export function useJobs(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
  });
}
```

#### Client State (UI state)
Use Zustand:
```typescript
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

#### Global State (auth, theme)
Use React Context:
```typescript
// contexts/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🧪 Testing

### Manual Testing Checklist

For each feature, verify:

- [ ] ✅ Page loads without errors
- [ ] ✅ Data displays correctly
- [ ] ✅ Forms submit successfully
- [ ] ✅ Validation works (required fields, email format, etc.)
- [ ] ✅ Error handling works (show error messages)
- [ ] ✅ Loading states work (spinners, skeletons)
- [ ] ✅ Responsive design (mobile, tablet, desktop)
- [ ] ✅ Navigation works (no full page reloads)
- [ ] ✅ No console errors
- [ ] ✅ API calls succeed

### Browser Testing

Test on:
- Chrome (primary)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Import path errors
```
Failed to resolve import "@/components/ui/button"
```
**Solution:** Update to `@/shared/components/ui/button`

#### Issue: Authentication not working
**Solution:**
1. Check token is stored: `localStorage.getItem('candidate_token')`
2. Check API interceptor is adding Authorization header
3. Check backend is running
4. Check CORS settings

#### Issue: API calls failing
**Solution:**
1. Check `VITE_API_URL` in `.env`
2. Check backend is running
3. Check endpoint exists in backend
4. Check request payload format
5. Check browser Network tab for details

---

## 📦 Deployment

### Build for Production

```bash
# Create production build
pnpm build

# Preview production build locally
pnpm preview
```

### Environment Variables for Production

```env
VITE_API_URL=https://api.hrm8.com
VITE_APP_ENV=production
```

### Hosting Options

- **Vercel** (Recommended) - Automatic deployments
- **Netlify** - Simple static hosting
- **AWS S3 + CloudFront** - Full control
- **Custom Server** - Nginx serving static files

---

## 🤝 Contributing

This is an internal project. For questions or to contribute:

1. Read **PLAN.md** to understand architecture
2. Check **UPDATES.md** to see what's been done
3. Follow the established patterns
4. Update documentation when making changes
5. Test thoroughly before committing

---

## 📄 License

Proprietary - HRM8

---

## 🎯 Current Status Summary

**Project Status:** 🔴 Not Started
**Current Phase:** Phase 0 - Project Setup
**Overall Progress:** 0%
**Files Migrated:** 0 / ~150
**Estimated Completion:** 3-4 weeks

**Next Steps:**
1. Initialize Vite + React + TypeScript project
2. Install all dependencies
3. Setup Tailwind CSS and shadcn/ui
4. Configure path aliases
5. Create directory structure

---

## 📞 Support

For questions or issues:
- Check **PLAN.md** for guidance
- Check **UPDATES.md** for solutions to similar problems
- Review **Common Issues** section above

---

**Last Updated:** [Date]
**Updated By:** [Name]

---

**🤖 Note for AI Agents:**
Please keep this README updated as you complete migration phases. Update the progress bars, statistics, and current status sections after each significant milestone.
