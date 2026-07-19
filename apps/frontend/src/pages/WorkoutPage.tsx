import { useEffect, useMemo, useState } from 'react'
import { Play, SkipForward, Check, X, BarChart3, TimerReset } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiGet, apiPost } from '@/lib/api'
import { getExerciseMedia } from '@/lib/exerciseMedia'
import { getCurrentWorkoutPlan, saveWorkoutCompletion } from '@/lib/appState'

interface WorkoutSet {
  reps: number
  weight: number
  completed: boolean
}

interface WorkoutExercise {
  id: string
  name: string
  sets: WorkoutSet[]
  restTime: number
  notes?: string
}

interface WorkoutPlanView {
  name: string
  split: string
  estimatedDuration: number
  schedule: Array<{
    focus?: string
    goalDrivers?: string[]
    exercises: Array<{
      exerciseId: string
      name: string
      sets: Array<{ reps: number; weight?: number; restTime: number }>
      notes?: string
    }>
  }>
}

interface WorkoutSessionResponse {
  session: { id: string }
}

const fallbackWorkout: WorkoutExercise[] = [
  {
    id: 'bench_press',
    name: 'Bench Press',
    sets: [
      { reps: 10, weight: 60, completed: false },
      { reps: 10, weight: 60, completed: false },
      { reps: 8, weight: 65, completed: false },
    ],
    restTime: 90,
  },
  {
    id: 'incline_db_press',
    name: 'Incline Dumbbell Press',
    sets: [
      { reps: 12, weight: 25, completed: false },
      { reps: 12, weight: 25, completed: false },
      { reps: 10, weight: 27.5, completed: false },
    ],
    restTime: 60,
  },
  {
    id: 'cable_fly',
    name: 'Cable Fly',
    sets: [
      { reps: 15, weight: 20, completed: false },
      { reps: 15, weight: 20, completed: false },
    ],
    restTime: 45,
  },
]

function mapPlanToWorkout(plan: WorkoutPlanView | null): WorkoutExercise[] {
  if (!plan) return fallbackWorkout

  return plan.schedule[0]?.exercises.map((exercise) => ({
    id: exercise.exerciseId,
    name: exercise.name,
    sets: exercise.sets.map((set) => ({
      reps: set.reps,
      weight: set.weight ?? 0,
      completed: false,
    })),
    restTime: exercise.sets[0]?.restTime ?? 60,
    notes: exercise.notes,
  })) ?? fallbackWorkout
}

function cloneWorkout(workout: WorkoutExercise[]) {
  return workout.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  }))
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function WorkoutPage() {
  const localPlan = getCurrentWorkoutPlan()
  const [remotePlan, setRemotePlan] = useState<WorkoutPlanView | null>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(true)
  const plan = remotePlan ?? localPlan
  const currentPlanDay = plan?.schedule[0]
  const workout = useMemo(() => mapPlanToWorkout(plan), [plan])
  const totalSets = useMemo(
    () => workout.reduce((count, exercise) => count + exercise.sets.length, 0),
    [workout],
  )

  const [sessionWorkout, setSessionWorkout] = useState<WorkoutExercise[] | null>(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [isResting, setIsResting] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentWeight, setCurrentWeight] = useState(0)
  const [currentReps, setCurrentReps] = useState(0)
  const [statusMessage, setStatusMessage] = useState('Ready when you are.')
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPlan() {
      try {
        const response = await apiGet<{ plan: WorkoutPlanView | null }>('/workouts/plan/current')
        if (!cancelled) {
          setRemotePlan(response.plan)
        }
      } catch {
        if (!cancelled) {
          setRemotePlan(null)
        }
      } finally {
        if (!cancelled) {
          setIsPlanLoading(false)
        }
      }
    }

    loadPlan()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isWorkoutActive) return

    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isWorkoutActive])

  useEffect(() => {
    if (!isResting) return

    const timer = window.setInterval(() => {
      setRestTimeRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          setIsResting(false)
          setStatusMessage('Rest complete. Let us move to the next set.')
          return 0
        }

        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isResting])

  useEffect(() => {
    const activeWorkout = sessionWorkout ?? workout
    const activeExercise = activeWorkout[currentExerciseIndex]
    const activeSet = activeExercise?.sets[currentSetIndex]

    setCurrentWeight(activeSet?.weight ?? 0)
    setCurrentReps(activeSet?.reps ?? 0)
  }, [currentExerciseIndex, currentSetIndex, sessionWorkout, workout])

  const activeWorkout = sessionWorkout ?? workout
  const currentExercise = activeWorkout[currentExerciseIndex]
  const currentSet = currentExercise?.sets[currentSetIndex]
  const currentExerciseMedia = getExerciseMedia(currentExercise?.id, currentExercise?.name)
  const currentGoalDrivers = currentPlanDay?.goalDrivers ?? []
  const completedSets = useMemo(
    () =>
      activeWorkout.reduce(
        (count, exercise) => count + exercise.sets.filter((set) => set.completed).length,
        0,
      ),
    [activeWorkout],
  )
  const currentVolume = useMemo(
    () =>
      activeWorkout.reduce(
        (sum, exercise) =>
          sum + exercise.sets.filter((set) => set.completed).reduce((setSum, set) => setSum + set.weight * set.reps, 0),
        0,
      ),
    [activeWorkout],
  )
  const workoutProgress = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100)

  const startWorkout = async () => {
    const startedAt = new Date().toISOString()
    const freshWorkout = cloneWorkout(workout)

    setSessionWorkout(freshWorkout)
    setIsWorkoutActive(true)
    setIsResting(false)
    setRestTimeRemaining(0)
    setElapsedSeconds(0)
    setCurrentExerciseIndex(0)
    setCurrentSetIndex(0)
    setSessionStartedAt(startedAt)
    setStatusMessage('Starting live workout session...')

    try {
      const response = await apiPost<WorkoutSessionResponse>('/workouts/sessions', {
        planName: plan?.name ?? 'Manual Workout',
        exercises: freshWorkout.length,
        sets: totalSets,
        startedAt,
      })

      setSessionId(response.session.id)
      setStatusMessage('Live workout connected to the backend.')
    } catch {
      setSessionId(`local-${Date.now()}`)
      setStatusMessage('Offline mode active. Session will still save locally.')
    }
  }

  const moveToNextSet = () => {
    if (!currentExercise) return

    if (currentSetIndex < currentExercise.sets.length - 1) {
      setCurrentSetIndex((value) => value + 1)
      setRestTimeRemaining(currentExercise.restTime)
      setIsResting(true)
      setStatusMessage(`Nice work. Rest for ${currentExercise.restTime} seconds, then go again.`)
      return
    }

    if (currentExerciseIndex < activeWorkout.length - 1) {
      const nextExercise = activeWorkout[currentExerciseIndex + 1]
      setCurrentExerciseIndex((value) => value + 1)
      setCurrentSetIndex(0)
      setRestTimeRemaining(nextExercise?.restTime ?? 60)
      setIsResting(true)
      setStatusMessage(`Great set. Let us recover before ${nextExercise?.name ?? 'the next movement'}.`)
      return
    }

    const completedAt = new Date().toISOString()
    const summary = {
      completedAt,
      planName: plan?.name ?? 'Manual Workout',
      exercises: activeWorkout.length,
      sets: totalSets,
    }

    saveWorkoutCompletion(summary)

    if (sessionId) {
      apiPost(`/workouts/sessions/${sessionId}/complete`, summary).catch(() => undefined)
    }

    setIsWorkoutActive(false)
    setIsResting(false)
    setRestTimeRemaining(0)
    setStatusMessage('Workout complete. Nice job, keep that momentum going.')
    setSessionId(null)
  }

  const completeSet = async () => {
    if (!currentExercise || !currentSet) return

    const now = new Date().toISOString()
    const nextWorkout = cloneWorkout(activeWorkout)
    nextWorkout[currentExerciseIndex].sets[currentSetIndex].completed = true
    setSessionWorkout(nextWorkout)

    if (sessionId) {
      apiPost(`/workouts/sessions/${sessionId}/logs`, {
        exerciseId: currentExercise.id,
        exerciseName: currentExercise.name,
        setIndex: currentSetIndex,
        exerciseIndex: currentExerciseIndex,
        reps: currentReps,
        weight: currentWeight,
        restSeconds: currentExercise.restTime,
        completedAt: now,
      }).catch(() => undefined)
    }

    setStatusMessage(`Logged ${currentReps} reps at ${currentWeight} kg. Strong work.`)
    moveToNextSet()
  }

  const skipSet = () => {
    if (!currentExercise || !currentSet) return

    setStatusMessage('Set skipped. Keep your pace and protect the form.')
    moveToNextSet()
  }

  if (isPlanLoading && !plan) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Loading your live workout...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isWorkoutActive) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold mb-3">Today&apos;s Workout</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {plan ? `${plan.name} - ${plan.split.replace(/_/g, ' ')}` : 'Manual workout mode'}
        </p>

        <Card className="mb-4 border border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Session Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workout.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  {getExerciseMedia(exercise.id, exercise.name) && (
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border bg-background">
                      <img
                        src={getExerciseMedia(exercise.id, exercise.name)!.gifUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets.length} sets - {exercise.sets.reduce((acc, set) => acc + set.reps, 0)} total reps
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground">{exercise.restTime}s rest</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Exercises</p>
                <p className="font-display text-2xl font-bold text-primary">{workout.length}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Sets</p>
                <p className="font-display text-2xl font-bold text-primary">{totalSets}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-display text-2xl font-bold text-primary">{plan?.estimatedDuration ?? 45}m</p>
              </div>
            </div>

            {currentPlanDay?.goalDrivers && currentPlanDay.goalDrivers.length > 0 && (
              <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Goals driving this session
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentPlanDay.goalDrivers.map((goal) => (
                    <span
                      key={goal}
                      className="rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full mt-4" size="lg" onClick={startWorkout}>
              <Play className="h-5 w-5 mr-2" />
              Start Live Workout
            </Button>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <RieChanAvatar size={72} expression="cheer" />
          <div className="space-y-1">
            <p className="font-semibold">Rie-chan is ready</p>
            <p className="text-sm text-muted-foreground">
              I will cheer you through each set, track the rest timer, and save the session live.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isResting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-background">
        <RieChanAvatar size={96} expression="rest" className="mb-4 animate-pulse-glow" />
        <h2 className="font-display text-2xl font-bold mb-2">Rest Time</h2>
        <p className="text-5xl font-display font-bold text-primary mb-4">
          {formatTime(restTimeRemaining)}
        </p>
        <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
          {statusMessage}
        </p>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" onClick={() => setRestTimeRemaining(0)}>
            <TimerReset className="h-5 w-5 mr-2" />
            Skip Rest
          </Button>
          <Button size="lg" onClick={() => setIsResting(false)}>
            <Play className="h-5 w-5 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setIsWorkoutActive(false)}>
          <X className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {activeWorkout.length}
          </p>
          <p className="font-display font-bold">
            Set {currentSetIndex + 1} of {currentExercise?.sets.length ?? 0}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <Card className="mb-4 border border-primary/20 bg-primary/5 overflow-hidden">
        {currentExerciseMedia && (
          <div className="aspect-video bg-secondary/40 border-b border-border overflow-hidden">
            <img
              src={currentExerciseMedia.gifUrl}
              alt={currentExerciseMedia.alt}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Live Session</p>
              <p className="font-semibold">{plan?.name ?? 'Manual Workout'}</p>
              {currentPlanDay?.focus && (
                <p className="text-xs text-muted-foreground mt-1">
                  Focus: {currentPlanDay.focus}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Elapsed</p>
              <p className="font-display font-bold text-primary">{formatTime(elapsedSeconds)}</p>
            </div>
          </div>

          {currentGoalDrivers.length > 0 && (
            <div className="mb-4 rounded-lg border border-primary/15 bg-primary/5 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Goals driving this day
              </p>
              <div className="flex flex-wrap gap-2">
                {currentGoalDrivers.map((goal) => (
                  <span
                    key={goal}
                    className="rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${workoutProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-lg bg-background p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">Done</p>
              <p className="font-display font-bold text-primary">{completedSets}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-display font-bold text-primary">{currentVolume}</p>
            </div>
            <div className="rounded-lg bg-background p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground">Session</p>
              <p className="font-display font-bold text-primary">{sessionStartedAt ? 'Live' : 'Ready'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 mb-4">
        <RieChanAvatar
          size={72}
          expression={isResting ? 'rest' : completedSets > 0 ? 'cheer' : 'point'}
        />
        <div className="space-y-1">
          <p className="font-semibold">Rie-chan says</p>
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="font-display text-3xl font-bold mb-2 text-center">{currentExercise?.name}</h1>
        <p className="text-muted-foreground mb-2 text-center">
          Target: {currentSet?.reps} reps @ {currentSet?.weight} kg
        </p>
        {currentExercise?.notes && (
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            {currentExercise.notes}
          </p>
        )}

        <Card className="w-full mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={currentWeight}
                  onChange={(event) => setCurrentWeight(Number(event.target.value))}
                  className="w-full h-12 rounded-lg border-2 border-input bg-background px-4 text-center text-2xl font-display font-bold"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Reps</label>
                <input
                  type="number"
                  value={currentReps}
                  onChange={(event) => setCurrentReps(Number(event.target.value))}
                  className="w-full h-12 rounded-lg border-2 border-input bg-background px-4 text-center text-2xl font-display font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 w-full">
          <Button variant="outline" className="flex-1 h-14" size="lg" onClick={skipSet}>
            <SkipForward className="h-5 w-5 mr-2" />
            Skip
          </Button>
          <Button className="flex-1 h-14" size="lg" onClick={completeSet}>
            <Check className="h-5 w-5 mr-2" />
            Log Set
          </Button>
        </div>
      </div>
    </div>
  )
}
