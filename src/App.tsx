import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

import { CandidateAuthProvider } from './contexts/CandidateAuthContext'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CandidateAuthProvider>
          <AppRoutes />
        </CandidateAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
