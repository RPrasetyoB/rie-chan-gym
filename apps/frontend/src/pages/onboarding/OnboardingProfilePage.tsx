import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { saveOnboardingProfile } from '@/lib/onboardingStorage'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  birthday: z.string().min(1, 'Birthday is required'),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be at most 250cm'),
  weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be at most 300kg'),
  bodyFat: z.number().min(0).max(100).optional(),
  goalWeight: z.number().min(30).max(300).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  injuries: z.string().optional(),
  equipment: z.string().optional(),
  workoutDays: z.number().min(1).max(7),
  sessionDuration: z.number().min(15).max(180),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function OnboardingProfilePage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      activityLevel: 'moderate',
      experienceLevel: 'beginner',
      workoutDays: 3,
      sessionDuration: 45,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    saveOnboardingProfile(data)
    navigate('/onboarding/goals')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 safe-area-top safe-area-bottom">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <RieChanAvatar size={64} feature="onboarding" />
          <h1 className="font-display text-2xl font-bold mt-4">Tell me about yourself!</h1>
          <p className="text-muted-foreground text-sm">This helps me create your perfect plan</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday *</Label>
                <Input
                  id="birthday"
                  type="date"
                  {...register('birthday')}
                  className={errors.birthday ? 'border-destructive' : ''}
                />
                {errors.birthday && (
                  <p className="text-sm text-destructive">{errors.birthday.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    {...register('height', { valueAsNumber: true })}
                    className={errors.height ? 'border-destructive' : ''}
                  />
                  {errors.height && (
                    <p className="text-sm text-destructive">{errors.height.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    {...register('weight', { valueAsNumber: true })}
                    className={errors.weight ? 'border-destructive' : ''}
                  />
                  {errors.weight && (
                    <p className="text-sm text-destructive">{errors.weight.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Body Fat % (optional)</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    placeholder="15"
                    {...register('bodyFat', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalWeight">Goal Weight (kg) (optional)</Label>
                  <Input
                    id="goalWeight"
                    type="number"
                    placeholder="65"
                    {...register('goalWeight', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLevel">Activity Level *</Label>
                <select
                  id="activityLevel"
                  {...register('activityLevel')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="sedentary">Sedentary (little or no exercise)</option>
                  <option value="light">Light (1-3 days/week)</option>
                  <option value="moderate">Moderate (3-5 days/week)</option>
                  <option value="active">Active (6-7 days/week)</option>
                  <option value="very_active">Very Active (hard exercise daily)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <select
                  id="experienceLevel"
                  {...register('experienceLevel')}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="beginner">Beginner (0-6 months)</option>
                  <option value="intermediate">Intermediate (6 months - 2 years)</option>
                  <option value="advanced">Advanced (2+ years)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuries">Injuries or Limitations (optional)</Label>
                <Input
                  id="injuries"
                  placeholder="e.g., shoulder injury, knee issues"
                  {...register('injuries')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Available Equipment (optional)</Label>
                <Input
                  id="equipment"
                  placeholder="e.g., gym access, dumbbells, bodyweight only"
                  {...register('equipment')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workoutDays">Workout Days/Week *</Label>
                  <Input
                    id="workoutDays"
                    type="number"
                    min="1"
                    max="7"
                    {...register('workoutDays', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration">Session Duration (min) *</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    min="15"
                    max="180"
                    {...register('sessionDuration', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/onboarding/welcome')}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          * Required fields
        </p>
      </div>
    </div>
  )
}
