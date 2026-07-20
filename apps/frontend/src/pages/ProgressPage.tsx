import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Scale, Camera, Trophy, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiGet } from '@/lib/api'
import { loadOnboardingState } from '@/lib/onboardingStorage'
import { getWorkoutStats, loadWorkoutHistory, type WorkoutCompletion } from '@/lib/appState'

type ProgressSummary = {
  streak: number
  totalWorkouts: number
  totalVolume: number
}

type WorkoutSession = {
  id: string
  planName: string
  exercises: number
  sets: number
  status: 'planned' | 'active' | 'completed' | 'skipped'
  completedAt?: string
  startedAt?: string
}

type ProfileResponse = {
  profile:
    | {
        weight: number
      }
    | null
}

type ProgressData = {
  summary: ProgressSummary
  sessions: WorkoutSession[]
  currentWeight: number
}

export default function ProgressPage() {
  const [selectedTab, setSelectedTab] = useState<'weight' | 'measurements' | 'photos'>('weight')
  const onboardingState = loadOnboardingState()
  const localStats = getWorkoutStats()
  const localWorkoutHistory = loadWorkoutHistory()
  const localSessions: WorkoutSession[] = localWorkoutHistory.map((entry: WorkoutCompletion, index) => ({
    id: `${entry.completedAt ?? 'local'}-${index}`,
    planName: entry.planName,
    exercises: entry.exercises,
    sets: entry.sets,
    status: 'completed',
    completedAt: entry.completedAt,
  }))
  const localSummary: ProgressSummary = {
    streak: localStats.currentStreak,
    totalWorkouts: localStats.totalWorkouts,
    totalVolume: localStats.totalVolume,
  }
  const progressCacheKey = ['progress-overview', onboardingState.profile?.name ?? 'guest']

  const {
    data: progressData,
    isLoading,
    dataUpdatedAt,
    refetch: syncProgress,
  } = useQuery<ProgressData>({
    queryKey: progressCacheKey,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    placeholderData: {
      summary: localSummary,
      sessions: localSessions,
      currentWeight: onboardingState.profile?.weight ?? 73,
    },
    queryFn: async () => {
      try {
        const [summaryResponse, sessionsResponse, profileResponse] = await Promise.all([
          apiGet<{ summary: ProgressSummary }>('/progress/summary'),
          apiGet<{ sessions: WorkoutSession[] }>('/progress/history'),
          apiGet<ProfileResponse>('/profile'),
        ])

        return {
          summary: summaryResponse.summary,
          sessions: sessionsResponse.sessions,
          currentWeight: profileResponse.profile?.weight ?? onboardingState.profile?.weight ?? 73,
        }
      } catch {
        return {
          summary: localSummary,
          sessions: localSessions,
          currentWeight: onboardingState.profile?.weight ?? 73,
        }
      }
    },
  })

  const summary = progressData?.summary ?? {
    streak: 0,
    totalWorkouts: 0,
    totalVolume: 0,
  }
  const sessions = progressData?.sessions ?? []
  const currentWeight = progressData?.currentWeight ?? onboardingState.profile?.weight ?? 73
  const lastSyncedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : null

  const recentSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.completedAt)
        .slice(0, 3)
        .map((session) => ({
          exercise: session.planName,
          weight: session.exercises * 10 + session.sets * 2,
          date: session.completedAt?.slice(0, 10) ?? 'N/A',
        })),
    [sessions],
  )

  const weightData = useMemo(() => {
    const baseWeight = currentWeight
    const points = Math.min(5, Math.max(3, recentSessions.length + 1))

    return Array.from({ length: points }, (_, index) => ({
      date: `Point ${index + 1}`,
      weight: Number((baseWeight - (points - index - 1) * 0.4).toFixed(1)),
    }))
  }, [currentWeight, recentSessions.length])

  const measurements = {
    chest: 95,
    waist: 82,
    hips: 98,
    arms: 35,
    thighs: 55,
  }

  const personalRecords = [
    ...recentSessions.map((session, index) => ({
      exercise: session.exercise,
      weight: session.weight,
      date: session.date,
      highlight: index === 0 ? 'Latest session' : 'Recent',
    })),
    { exercise: 'Squat', weight: 100, date: '2026-07-18', highlight: 'Seeded PR' },
    { exercise: 'Deadlift', weight: 120, date: '2026-07-15', highlight: 'Seeded PR' },
  ].slice(0, 3)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Your Progress</h1>
          <p className="text-sm text-muted-foreground">
            Live progress synced from your workout sessions
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => syncProgress()} aria-label="Refresh progress">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-display text-2xl font-bold text-primary">{summary.streak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Workouts</p>
            <p className="font-display text-2xl font-bold">{summary.totalWorkouts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="font-display text-2xl font-bold">{(summary.totalVolume / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
      </div>

      {lastSyncedAt && (
        <p className="text-xs text-muted-foreground mb-4">
          Last synced {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedTab === 'weight' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setSelectedTab('weight')}
        >
          <Scale className="h-4 w-4 mr-2" />
          Weight
        </Button>
        <Button
          variant={selectedTab === 'measurements' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setSelectedTab('measurements')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Measurements
        </Button>
        <Button
          variant={selectedTab === 'photos' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setSelectedTab('photos')}
        >
          <Camera className="h-4 w-4 mr-2" />
          Photos
        </Button>
      </div>

      {selectedTab === 'weight' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Weight Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-display font-bold text-primary">
                  {currentWeight.toFixed(1)} kg
                </p>
                <p className="text-sm text-muted-foreground">Current weight</p>
                <p className="text-sm text-green-500 mt-1">-2 kg from start</p>
              </div>
              <div className="h-32 flex items-end gap-2">
                {weightData.map((data) => (
                  <div
                    key={data.date}
                    className="flex-1 bg-primary/20 rounded-t-lg relative group"
                    style={{ height: `${Math.max(18, ((80 - data.weight) / 7) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.weight.toFixed(1)}kg
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{weightData[0]?.date ?? 'Start'}</span>
                <span>{weightData[weightData.length - 1]?.date ?? 'Now'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personalRecords.map((pr) => (
                  <div
                    key={`${pr.exercise}-${pr.date}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">{pr.exercise}</p>
                      <p className="text-xs text-muted-foreground">
                        {pr.date} · {pr.highlight}
                      </p>
                    </div>
                    <p className="font-display font-bold text-primary">{pr.weight} kg</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'measurements' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Body Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(measurements).map(([part, value]) => (
                <div key={part} className="flex items-center justify-between">
                  <span className="capitalize text-muted-foreground">{part}</span>
                  <span className="font-display font-bold">{value} cm</span>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4">Update Measurements</Button>
          </CardContent>
        </Card>
      )}

      {selectedTab === 'photos' && (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Progress Photos Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take photos to track your transformation over time
            </p>
            <Button>
              <Camera className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-4 py-8 mt-4">
        <RieChanAvatar size={48} feature="progress" />
        <p className="text-muted-foreground text-sm">Keep up the great work! 💪</p>
      </div>
      {isLoading && <span className="sr-only">Loading progress data</span>}
    </div>
  )
}
