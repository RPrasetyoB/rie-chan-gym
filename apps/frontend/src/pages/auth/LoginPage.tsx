import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { apiPost, saveAuthTokens } from '@/lib/api'
import { saveAuthSession } from '@/lib/appState'

type LoginPageProps = { adminMode?: boolean }

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage({ adminMode = false }: LoginPageProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiPost<{
        user: { id: string; email: string; name: string; role: string }
        accessToken: string
        refreshToken: string
      }>('/auth/login', data, false)

      if (adminMode && response.user.role !== 'admin') {
        toast({ title: 'Admin access required', description: 'This account does not have administrator permissions.', variant: 'destructive' })
        return
      }

      saveAuthTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      })
      saveAuthSession({ id: response.user.id, name: response.user.name, email: response.user.email, role: response.user.role, createdAt: new Date().toISOString() })

      toast({
        title: 'Welcome back!',
        description: 'You are signed in to Rie-chan Cute PT.',
      })

      navigate(response.user.role === 'admin' ? '/admin' : '/')
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Could not sign you in.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardHeader className="space-y-1">
        <CardTitle className="font-display text-2xl text-center">{adminMode ? 'Admin sign in' : 'Welcome Back!'}</CardTitle>
        <CardDescription className="text-center">
          {adminMode ? 'Sign in with an administrator account to continue.' : 'Sign in to continue your fitness journey with Rie-chan'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            {!adminMode && <span className="text-muted-foreground">Don't have an account? </span>}
            {!adminMode && <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
