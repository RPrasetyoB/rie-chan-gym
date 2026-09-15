import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiGet } from '@/lib/api'
import { loadOnboardingState, normalizeEquipmentSelection, saveOnboardingProfile } from '@/lib/onboardingStorage'

const EQUIPMENT_OPTIONS = [
  { value: 'gym access', label: 'Gym access' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'band', label: 'Band' },
  { value: 'cable', label: 'Cable' },
  { value: 'pull-up bar', label: 'Pull-up bar' },
  { value: 'assisted pull-up machine', label: 'Assisted pull-up machine' },
  { value: 'assisted dip machine', label: 'Assisted dip machine' },
  { value: 'leg press machine', label: 'Leg press machine' },
  { value: 'cardio machine', label: 'Cardio machine' },
  { value: 'stationary bike', label: 'Stationary bike' },
  { value: 'elliptical machine', label: 'Elliptical machine' },
  { value: 'rope', label: 'Jump rope' },
] as const

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
  equipment: z.array(z.string()).default([]),
  workoutDays: z.number().min(1).max(7),
  sessionDuration: z.number().min(15).max(180),
})

type ProfileFormData = z.infer<typeof profileSchema>

type RemoteProfileResponse = {
  profile:
    | (Omit<Partial<ProfileFormData>, 'equipment'> & {
        name?: string
        equipment?: string | string[]
      })
    | null
}

function getProfileDefaultValues(profile?: Partial<ProfileFormData>): ProfileFormData {
  return {
    name: profile?.name ?? '',
    birthday: profile?.birthday ?? '',
    gender: profile?.gender ?? 'male',
    height: profile?.height ?? 170,
    weight: profile?.weight ?? 70,
    bodyFat: profile?.bodyFat,
    goalWeight: profile?.goalWeight,
    activityLevel: profile?.activityLevel ?? 'moderate',
    experienceLevel: profile?.experienceLevel ?? 'beginner',
    injuries: profile?.injuries ?? '',
    equipment: normalizeEquipmentSelection(profile?.equipment ?? ''),
    workoutDays: profile?.workoutDays ?? 3,
    sessionDuration: profile?.sessionDuration ?? 45,
  }
}

export default function OnboardingProfilePage() {
  const navigate = useNavigate()
  const [savedProfile] = useState(() => loadOnboardingState().profile)
  const defaultValues = useMemo(() => getProfileDefaultValues(savedProfile), [savedProfile])
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })
  const selectedEquipment = watch('equipment') ?? []

  useEffect(() => {
    let isMounted = true

    const hydrateProfile = async () => {
      try {
        const response = await apiGet<RemoteProfileResponse>('/profile')
        if (!isMounted || !response.profile) return

        reset({
          ...defaultValues,
          ...response.profile,
          equipment: normalizeEquipmentSelection(response.profile.equipment ?? ''),
        })
      } catch {
        // Keep local defaults when the backend profile is unavailable.
      }
    }

    hydrateProfile()

    return () => {
      isMounted = false
    }
  }, [defaultValues, reset])

  const onSubmit = async (data: ProfileFormData) => {
    saveOnboardingProfile(data)
    navigate('/onboarding/goals')
  }

  const toggleEquipment = (equipment: string) => {
    const next = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter((item) => item !== equipment)
      : [...selectedEquipment, equipment]

    setValue('equipment', next, { shouldDirty: true, shouldTouch: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 px-4 pt-8 pb-10">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <RieChanAvatar size={64} pose="hallo" className="mx-auto" />
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
                  {...register('bodyFat', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalWeight">Goal Weight (kg) (optional)</Label>
                <Input
                  id="goalWeight"
                  type="number"
                  placeholder="65"
                  {...register('goalWeight', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
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
                <Label>Available Equipment (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Select every tool you can use so your workout suggestions stay realistic.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {EQUIPMENT_OPTIONS.map((equipment) => {
                    const checked = selectedEquipment.includes(equipment.value)
                    return (
                      <label
                        key={equipment.value}
                        className={[
                          'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors',
                          checked
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEquipment(equipment.value)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span>{equipment.label}</span>
                      </label>
                    )
                  })}
                </div>
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
