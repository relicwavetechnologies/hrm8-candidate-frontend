/**
 * Candidate Login Page
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useCandidateAuth } from '@/contexts/CandidateAuthContext'
import { candidateAuthService } from '@/shared/services/candidateAuthService'
import { VerificationEmailCard } from '@/shared/components/auth/VerificationEmailCard'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'

const LAST_VERIFICATION_KEY = 'candidateLastVerification'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const { login, isAuthenticated, isLoading: authLoading } = useCandidateAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultEmail = searchParams.get('email') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmail,
    },
  })

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const pendingEmailParam = searchParams.get('pendingEmail')
  const verificationSuccess = searchParams.get('verified') === 'true'
  const verificationEmail = searchParams.get('email') || defaultEmail

  useEffect(() => {
    if (defaultEmail) {
      setValue('email', defaultEmail)
    }
  }, [defaultEmail, setValue])

  useEffect(() => {
    if (pendingEmailParam && !verificationSuccess) {
      setPendingVerificationEmail(pendingEmailParam)
      reset({ email: pendingEmailParam, password: '' })
    }
  }, [pendingEmailParam, reset, verificationSuccess])

  useEffect(() => {
    if (verificationSuccess) {
      setPendingVerificationEmail(null)
    }
  }, [verificationSuccess])

  const clearPendingVerification = useCallback(() => {
    setPendingVerificationEmail(null)
    const currentEmail = pendingVerificationEmail || defaultEmail || ''
    reset({ email: currentEmail, password: '' })

    if (pendingEmailParam) {
      const params = new URLSearchParams(searchParams)
      params.delete('pendingEmail')
      const nextSearch = params.toString()
      navigate(nextSearch ? `/login?${nextSearch}` : '/login', { replace: true })
    }
  }, [defaultEmail, navigate, pendingEmailParam, pendingVerificationEmail, reset, searchParams])

  useEffect(() => {
    const processVerificationSignal = (rawValue: string | null) => {
      if (!rawValue) {
        return
      }

      try {
        const payload = JSON.parse(rawValue) as { email?: string }
        if (!payload?.email) {
          return
        }

        localStorage.removeItem(LAST_VERIFICATION_KEY)
        if (pendingVerificationEmail) {
          clearPendingVerification()
        } else {
          reset({ email: payload.email, password: '' })
        }

        const params = new URLSearchParams(searchParams)
        params.set('verified', 'true')
        params.set('email', payload.email)
        params.delete('pendingEmail')
        navigate(`/login?${params.toString()}`, { replace: true })
      } catch {
        // Ignore malformed payloads
      }
    }

    processVerificationSignal(localStorage.getItem(LAST_VERIFICATION_KEY))

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_VERIFICATION_KEY && event.newValue) {
        processVerificationSignal(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [clearPendingVerification, navigate, pendingVerificationEmail, reset, searchParams])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (!result.success && result.pendingVerification) {
        setPendingVerificationEmail(result.pendingVerification.email)
      }
      if (result.success) {
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return pendingVerificationEmail ? (
    <VerificationEmailCard
      email={pendingVerificationEmail}
      backLabel="Back to login"
      onBack={clearPendingVerification}
      onResend={async () => {
        const response = await candidateAuthService.resendVerification(pendingVerificationEmail)
        if (!response.success) {
          throw new Error(response.error || 'Failed to resend verification email.')
        }
      }}
      autoResend
      watchVerification
      onVerified={(verifiedEmail) => {
        if (verifiedEmail) {
          reset({ email: verifiedEmail, password: '' })
        }
        clearPendingVerification()
        const params = new URLSearchParams(searchParams)
        params.set('verified', 'true')
        if (verifiedEmail) {
          params.set('email', verifiedEmail)
        } else {
          params.delete('email')
        }
        params.delete('pendingEmail')
        navigate(`/login?${params.toString()}`, { replace: true })
      }}
    />
  ) : (
    <Card className="border-border/70 bg-background/95 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold tracking-tight">Candidate sign in</CardTitle>
        <CardDescription>
          Open your dashboard, review applications, and continue your hiring journey in one place.
        </CardDescription>
        {verificationSuccess && (
          <Alert className="mt-4 border-success/20 bg-success/10 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Email verified</AlertTitle>
            <AlertDescription className="text-sm">
              {verificationEmail
                ? `Great! You can now sign in as ${verificationEmail}.`
                : 'Great! You can now sign in with your account.'}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-2">
        <div className="text-sm text-center text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </div>
        <div className="text-sm text-center">
          <Link to="/jobs" className="text-muted-foreground hover:text-primary transition-colors">
            Browse jobs without an account
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
