import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min  - after this, background refetch fires on next visit
      gcTime: 1000 * 60 * 30,    // 30 min - data stays in memory even after stale, no spinner on back-navigation
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

import { CandidateAuthProvider, useCandidateAuth } from './contexts/CandidateAuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, candidate } = useCandidateAuth()
  return (
    <WebSocketProvider
      isAuthenticated={isAuthenticated}
      userEmail={candidate?.email}
    >
      {children}
    </WebSocketProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <CandidateAuthProvider>
            <WebSocketWrapper>
              <AppRoutes />
            </WebSocketWrapper>
          </CandidateAuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
