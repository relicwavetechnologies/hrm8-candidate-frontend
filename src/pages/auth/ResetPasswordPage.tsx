import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { candidateAuthService } from '@/shared/services/candidateAuthService'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof passwordSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const isTokenMissing = useMemo(() => token.trim().length === 0, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (isTokenMissing) {
      setError('Reset token is missing. Please use the link from your email.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError(null)

    const response = await candidateAuthService.resetPassword({
      token,
      password: data.password,
    })

    if (!response.success) {
      setError(response.error || 'Unable to reset password. Please request a new link.')
      setStatus('error')
      return
    }

    reset()
    setStatus('success')
  }

  return (
    <Card className="border-border/70 bg-background/95 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold tracking-tight">Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password to secure your candidate account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isTokenMissing ? (
          <Alert variant="destructive">
            <AlertTitle>Reset link invalid</AlertTitle>
            <AlertDescription>
              The reset link is missing or invalid. Please request a new password reset email.
            </AlertDescription>
          </Alert>
        ) : status === 'success' ? (
          <Alert className="border-success/20 bg-success/10 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Password updated</AlertTitle>
            <AlertDescription>
              Your password has been changed. You can now{' '}
              <Button
                variant="link"
                className="h-auto p-0 font-semibold underline"
                onClick={() => navigate('/login')}
              >
                sign in
              </Button>
              .
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                className="h-11"
                {...register('password')}
                disabled={status === 'loading'}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include uppercase, lowercase, and numeric characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                className="h-11"
                {...register('confirmPassword')}
                disabled={status === 'loading'}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="h-11 w-full text-base" disabled={status === 'loading'}>
              {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status === 'loading' ? 'Updating password...' : 'Update password'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 pt-4 text-center text-sm text-muted-foreground">
        <span>
          Need to try again?{' '}
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Request another link
          </Link>
        </span>
        <span>
          Back to{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            login
          </Link>
        </span>
      </CardFooter>
    </Card>
  )
}
