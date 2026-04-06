import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AppRoutes } from './app/routes'
import { Toaster as SonnerToaster, toast } from './shared/components/ui/sonner'
import { Toaster as RadixToaster } from './shared/components/ui/toaster'
import { CandidateAuthProvider, useCandidateAuth } from './contexts/CandidateAuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ErrorBoundary } from './shared/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.message || 'Something went wrong. Please try again.'
        toast.error(message)
      },
    },
  },
})

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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <BrowserRouter future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
            <CandidateAuthProvider>
              <WebSocketWrapper>
                <AppRoutes />
                <SonnerToaster richColors closeButton />
                <RadixToaster />
              </WebSocketWrapper>
            </CandidateAuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
