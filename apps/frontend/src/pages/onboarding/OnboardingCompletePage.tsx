import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { useToast } from '@/hooks/use-toast'
import { apiPut } from '@/lib/api'
import { calculateBMI, calculateBMR, calculateDailyCalories } from '@/lib/utils'
import { formatGoalLabel, generateWorkoutPlan } from '@/lib/recommendationEngine'
import {
  calculateAgeFromBirthday,
  loadOnboardingState,
  markOnboardingCompleted,
} from '@/lib/onboardingStorage'

export default function OnboardingCompletePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const onboardingState = loadOnboardingState()
  const profile = onboardingState.profile
  const goals = onboardingState.goals ?? ['general_fitness']
  const age = profile?.birthday ? calculateAgeFromBirthday(profile.birthday) : 25

  const resolvedProfile = {
    height: profile?.height ?? 170,
    weight: profile?.weight ?? 70,
    age,
    gender: profile?.gender ?? ('male' as const),
    activityLevel: profile?.activityLevel ?? ('moderate' as const),
  }

  const bmi = calculateBMI(resolvedProfile.weight, resolvedProfile.height / 100)
  const bmr = calculateBMR(
    resolvedProfile.weight,
    resolvedProfile.height,
    resolvedProfile.age,
    resolvedProfile.gender,
  )
  const dailyCalories = calculateDailyCalories(bmr, resolvedProfile.activityLevel)

  const workoutPlan = profile
    ? generateWorkoutPlan({
        ...profile,
        age: resolvedProfile.age,
        goals,
      })
    : null

  const handleStart = async () => {
    if (profile) {
      try {
        await apiPut('/profile', {
          birthday: profile.birthday,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          bodyFat: profile.bodyFat,
          goalWeight: profile.goalWeight,
          activityLevel: profile.activityLevel,
          experienceLevel: profile.experienceLevel,
          injuries: profile.injuries,
          equipment: profile.equipment,
          workoutDays: profile.workoutDays,
          sessionDuration: profile.sessionDuration,
          goals,
        })
      } catch (error) {
        toast({
          title: 'Could not save profile',
          description: error instanceof Error ? error.message : 'The backend did not accept your onboarding data.',
          variant: 'destructive',
        })
        return
      }
    }

    markOnboardingCompleted()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="animate-bounce-subtle">
          <RieChanAvatar size={128} feature="completion" />
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold text-primary mb-2">
            You&apos;re all set! 🎉
          </h1>
          <p className="text-lg font-medium mb-4">
            Your personalized plan is ready
          </p>
          <p className="text-sm text-muted-foreground">
            {profile?.name ? `${profile.name}, ` : ''}I&apos;ve saved your setup and generated your starter plan.
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="text-left space-y-3">
              <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">BMI</span>
                <span className="font-display font-bold">{bmi.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">BMR</span>
                <span className="font-display font-bold">{bmr.toFixed(0)} kcal</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                <span className="text-muted-foreground">Daily Calories</span>
                <span className="font-display font-bold">{dailyCalories.toFixed(0)} kcal</span>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg text-left">
              <p className="text-sm font-medium mb-2">💬 Rie-chan&apos;s Tip</p>
              <p className="text-sm text-muted-foreground">
                {workoutPlan
                  ? `I built a ${workoutPlan.split.replace(/_/g, ' ')} plan with ${workoutPlan.schedule.length} training days. Let&apos;s begin with a steady, sustainable start.`
                  : 'Based on your profile, I will build a workout plan that fits your goals and schedule.'}
              </p>
            </div>

            {workoutPlan && (
              <div className="p-4 bg-secondary/50 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">Plan Preview</p>
                <p className="text-sm text-muted-foreground">
                  {workoutPlan.name} · {workoutPlan.estimatedDuration} min sessions
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  First focus: {workoutPlan.schedule[0]?.focus}
                </p>
                <div className="mt-4 space-y-3">
                  {workoutPlan.schedule.map((day) => (
                    <div key={day.day} className="rounded-lg border border-border bg-background/70 p-3">
                      <p className="text-sm font-medium">
                        Day {day.day} · {day.focus}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Goals driving this day: {day.goalDrivers.map((goal) => formatGoalLabel(goal)).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
        >
          Start Your Journey!
        </Button>

        <p className="text-xs text-muted-foreground">
          You can always adjust your plan in Settings
        </p>
      </div>
    </div>
  )
}
