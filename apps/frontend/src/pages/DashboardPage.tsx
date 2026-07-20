import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame, Trophy, Target, TrendingUp, Clock, Dumbbell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiGet } from '@/lib/api'
import { generateWorkoutPlan } from '@/lib/recommendationEngine'
import { calculateAgeFromBirthday, loadOnboardingState } from '@/lib/onboardingStorage'
import { getWorkoutStats, loadAuthSession, loadWorkoutHistory, type WorkoutCompletion } from '@/lib/appState'
import { getBMIStatus, getFitWeightTarget } from '@/lib/utils'

type WorkoutPlan = ReturnType<typeof generateWorkoutPlan> | null

type DashboardSummary = {
  streak: number
  totalWorkouts: number
  totalVolume: number
}

type DashboardHistoryItem = WorkoutCompletion & {
  id: string
}

type DashboardProfile = {
  birthday: string
  name?: string
  height: number
  weight: number
  gender: 'male' | 'female' | 'other'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  injuries?: string
  equipment?: string
  workoutDays: number
  sessionDuration: number
} | null

type DashboardData = {
  summary: DashboardSummary
  plan: WorkoutPlan
  history: DashboardHistoryItem[]
  profile: DashboardProfile
}

export default function DashboardPage() {
  const onboardingState = loadOnboardingState()
  const authSession = loadAuthSession()
  const localProfile = onboardingState.profile
  const goals = onboardingState.goals ?? ['general_fitness']
  const localAge = localProfile?.birthday ? calculateAgeFromBirthday(localProfile.birthday) : 25
  const localWorkoutPlan = localProfile
    ? generateWorkoutPlan({
        ...localProfile,
        age: localAge,
        goals,
      })
    : null
  const localWorkoutHistory = loadWorkoutHistory()
  const workoutStats = getWorkoutStats()
  const dashboardCacheKey = ['dashboard-overview', authSession?.email ?? localProfile?.name ?? 'guest']
  const localDashboardHistory: DashboardHistoryItem[] = localWorkoutHistory.map((entry, index) => ({
    ...entry,
    id: `${entry.completedAt ?? 'local'}-${index}`,
  }))

  const {
    data: dashboardData,
    isLoading: isSyncing,
    dataUpdatedAt,
  } = useQuery<DashboardData>({
    queryKey: dashboardCacheKey,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    placeholderData: {
      summary: {
        streak: workoutStats.currentStreak,
        totalWorkouts: workoutStats.totalWorkouts || 42,
        totalVolume: workoutStats.totalVolume || 125000,
      },
      plan: localWorkoutPlan,
      history: localDashboardHistory,
      profile: localProfile ?? null,
    },
    queryFn: async () => {
      const [summaryResponse, planResponse, historyResponse, profileResponse] = await Promise.all([
        apiGet<{ summary: DashboardSummary }>('/progress/summary'),
        apiGet<{ plan: WorkoutPlan }>('/workouts/plan/current'),
        apiGet<{ sessions: DashboardHistoryItem[] }>('/workouts/history'),
        apiGet<{ profile: DashboardProfile }>('/profile'),
      ])

      return {
        summary: summaryResponse.summary,
        plan: planResponse.plan,
        history: historyResponse.sessions,
        profile: profileResponse.profile,
      }
    },
  })

  const resolvedProfile = dashboardData?.profile ?? localProfile
  const resolvedPlan = dashboardData?.plan ?? localWorkoutPlan
  const bmiStatus = resolvedProfile
    ? getBMIStatus(resolvedProfile.weight, resolvedProfile.height)
    : null
  const fitWeightTarget = resolvedProfile
    ? getFitWeightTarget(resolvedProfile.weight, resolvedProfile.height)
    : null
  const summary = dashboardData?.summary ?? {
    streak: workoutStats.currentStreak,
    totalWorkouts: workoutStats.totalWorkouts || 42,
    totalVolume: workoutStats.totalVolume || 125000,
  }
  const remoteHistory = dashboardData?.history ?? []
  const lastSyncedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : null

  const todayWorkout = {
    name: resolvedPlan?.name ?? 'Upper Body Push',
    exercises: resolvedPlan?.schedule[0]?.exercises.length ?? 6,
    estimatedDuration: resolvedPlan?.estimatedDuration ?? 45,
    focus: resolvedPlan?.schedule[0]?.focus ?? 'Full Body',
    goalDrivers: resolvedPlan?.schedule[0]?.goalDrivers ?? goals.map((goal: string) => goal.replace(/_/g, ' ')),
    completed: false,
  }

  const recentAchievements = useMemo(
    () => [
      {
        id: 'streak',
        title: `${summary.streak}-Day Streak`,
        icon: '🔥',
        unlockedAt: summary.streak > 0 ? 'Active now' : 'Get moving',
      },
      {
        id: 'workouts',
        title: `${summary.totalWorkouts} Logged Workouts`,
        icon: '🏋️',
        unlockedAt: remoteHistory[0]?.completedAt ? remoteHistory[0].completedAt.slice(0, 10) : 'This week',
      },
    ],
    [remoteHistory, summary.streak, summary.totalWorkouts],
  )

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Good Morning{resolvedProfile?.name || authSession?.name ? `, ${resolvedProfile?.name || authSession?.name}` : ''}! 💪
          </h1>
          <p className="text-muted-foreground text-sm">
            {resolvedPlan
              ? `Today is your ${resolvedPlan.split.replace(/_/g, ' ')} session.`
              : 'Ready to crush it today?'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSyncing
              ? 'Syncing live stats...'
              : lastSyncedAt
                ? `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Working from local data'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RieChanAvatar size={64} feature="dashboard" />
        </div>
      </div>

      <Card className="mb-4 border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="font-display text-2xl font-bold text-primary">{summary.streak} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Best: 14 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Today&apos;s Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayWorkout.completed ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Workout completed! 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{todayWorkout.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Focus: {todayWorkout.focus}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    {todayWorkout.exercises} exercises
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {todayWorkout.estimatedDuration} min
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Goals driving this day
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {todayWorkout.goalDrivers.map((goal) => (
                      <span
                        key={goal}
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link to="/workout">
                <Button className="w-full mt-4" size="lg">
                  Start Workout
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Volume</p>
            </div>
            <p className="font-display text-xl font-bold">{(summary.totalVolume / 1000).toFixed(0)}k kg</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total load = sets x reps x weight across your logged workouts.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
            <p className="font-display text-xl font-bold">{summary.totalWorkouts}</p>
          </CardContent>
        </Card>
      </div>

      {bmiStatus && (
        <Card className="mb-4 border border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Body status</p>
                <p className="font-display text-lg font-bold">{bmiStatus.label}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold">{bmiStatus.bmi.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">BMI</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3">{bmiStatus.recommendation}</p>
            {fitWeightTarget && fitWeightTarget.status !== 'normal' && fitWeightTarget.rangeKg && (
              <div className="mt-4 rounded-lg border border-border bg-background/70 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Fit weight target</p>
                <p className="font-display text-lg font-bold text-primary mt-1">
                  {fitWeightTarget.rangeKg[0].toFixed(1)} - {fitWeightTarget.rangeKg[1].toFixed(1)} kg
                </p>
                <p className="text-sm text-muted-foreground mt-2">{fitWeightTarget.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.unlockedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
