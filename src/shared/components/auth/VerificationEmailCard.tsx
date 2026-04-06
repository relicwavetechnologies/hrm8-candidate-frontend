import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

const LAST_VERIFICATION_KEY = 'candidateLastVerification'

interface VerificationEmailCardProps {
  email: string
  subtitle?: string
  instructions?: string[]
  onBack?: () => void
  backLabel?: string
  onResend?: () => Promise<void>
  autoResend?: boolean
  watchVerification?: boolean
  onVerified?: (verifiedEmail: string) => void
  className?: string
}

export function VerificationEmailCard({
  email,
  subtitle = "We've sent a verification link to your email address",
  instructions = [
    'Check your inbox and spam folder',
    'Click the verification link in the email',
    'Return here and sign in once your email is verified',
  ],
  onBack,
  backLabel = 'Back',
  onResend,
  autoResend = false,
  watchVerification = false,
  onVerified,
  className,
}: VerificationEmailCardProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>(autoResend ? 'success' : 'idle')
  const [resendMessage, setResendMessage] = useState<string | null>(
    autoResend ? 'Verification email sent. Please check your inbox.' : null
  )
  const [hasAutoResent, setHasAutoResent] = useState(false)

  const handleResend = useCallback(async () => {
    if (!onResend) return

    setIsResending(true)
    try {
      await onResend()
      setResendStatus('success')
      setResendMessage('Verification email sent. Please check your inbox.')
    } catch (error) {
      setResendStatus('error')
      setResendMessage(
        error instanceof Error ? error.message : 'Failed to resend verification email. Please try again.'
      )
    } finally {
      setIsResending(false)
    }
  }, [onResend])

  useEffect(() => {
    if (!autoResend || !onResend || hasAutoResent) return

    setHasAutoResent(true)
    setResendStatus('success')
    setResendMessage('Verification email sent. Please check your inbox.')
    void handleResend()
  }, [autoResend, onResend, hasAutoResent, handleResend])

  useEffect(() => {
    if (!watchVerification || !onVerified) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const processSignal = (rawValue: string | null) => {
      if (!rawValue) return

      try {
        const payload = JSON.parse(rawValue) as { email?: string }
        if (payload?.email && payload.email.toLowerCase() === email.toLowerCase()) {
          localStorage.removeItem(LAST_VERIFICATION_KEY)
          onVerified(payload.email)
        }
      } catch {
        // Ignore malformed payloads
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LAST_VERIFICATION_KEY && event.newValue) {
        processSignal(event.newValue)
      }
    }

    processSignal(localStorage.getItem(LAST_VERIFICATION_KEY))
    window.addEventListener('storage', handleStorage)
    intervalId = setInterval(() => {
      processSignal(localStorage.getItem(LAST_VERIFICATION_KEY))
    }, 5000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      if (intervalId) clearInterval(intervalId)
    }
  }, [email, watchVerification, onVerified])

  return (
    <Card className={cn('border-border/70 bg-background/95 shadow-sm backdrop-blur', className)}>
      <CardHeader className="space-y-1">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">Check your email</CardTitle>
        <CardDescription className="text-center">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">We sent a verification email to:</p>
          <p className="font-medium">{email}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Next steps:</p>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                {instructions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        {resendMessage && (
          <p
            className={cn(
              'text-center text-sm',
              resendStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {resendMessage}
          </p>
        )}
        {onResend && (
          <Button className="w-full" variant="outline" disabled={isResending} onClick={() => void handleResend()}>
            {isResending ? 'Sending...' : 'Resend verification email'}
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {onBack && (
          <Button variant="ghost" className="w-full" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
