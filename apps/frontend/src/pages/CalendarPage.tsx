import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/api'
import { getCurrentWorkoutPlan, loadWorkoutHistory } from '@/lib/appState'

type CalendarResponse = {
  plan: ReturnType<typeof getCurrentWorkoutPlan>
  sessions: Array<{
    id: string
    completedAt?: string
    status: 'planned' | 'active' | 'completed' | 'skipped'
  }>
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [remotePlan, setRemotePlan] = useState<CalendarResponse['plan']>(null)
  const [remoteSessions, setRemoteSessions] = useState<CalendarResponse['sessions']>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const localPlan = getCurrentWorkoutPlan()
  const localSessions = loadWorkoutHistory()

  const syncCalendar = async () => {
    try {
      const response = await apiGet<CalendarResponse>('/calendar')
      setRemotePlan(response.plan)
      setRemoteSessions(response.sessions)
      setLastSyncedAt(new Date())
    } catch {
      setRemotePlan(null)
      setRemoteSessions([])
    }
  }

  useEffect(() => {
    syncCalendar()

    const timer = window.setInterval(() => {
      syncCalendar()
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  const workoutPlan = remotePlan ?? localPlan
  const workoutHistory = remoteSessions.length > 0 ? remoteSessions : localSessions

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: Array<Date | null> = []
    for (let i = 0; i < startingDay; i += 1) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getWorkoutStatus = (date: Date) => {
    const dateKey = date.toISOString().slice(0, 10)
    const completed = workoutHistory.some((entry) => entry.completedAt?.slice(0, 10) === dateKey)
    if (completed) return 'completed'

    const workoutDays = workoutPlan?.schedule.length ?? 3
    const dayOfWeek = date.getDay()

    if (workoutDays <= 2) return dayOfWeek === 1 || dayOfWeek === 4 ? 'scheduled' : 'rest'
    if (workoutDays === 3) return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5 ? 'scheduled' : 'rest'
    if (workoutDays === 4) {
      return dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6 ? 'scheduled' : 'rest'
    }
    return dayOfWeek >= 1 && dayOfWeek <= 5 ? 'scheduled' : 'rest'
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const firstWorkout = workoutPlan?.schedule[0]
  const workoutSessionCount = useMemo(
    () => workoutHistory.filter((session) => session.completedAt).length,
    [workoutHistory],
  )

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendar</h1>
          <p className="text-xs text-muted-foreground">
            {workoutSessionCount} completed sessions tracked live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={syncCalendar} aria-label="Refresh calendar">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon">
            <CalendarIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {lastSyncedAt && (
        <p className="text-xs text-muted-foreground mb-4">
          Last synced {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="font-display text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />
              }

              const status = getWorkoutStatus(date)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm relative
                    ${isToday ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-secondary'}
                    ${status === 'completed' && !isToday ? 'bg-green-500/20 text-green-600' : ''}
                    ${status === 'scheduled' && !isToday ? 'bg-primary/20 text-primary' : ''}
                    ${status === 'rest' && !isToday ? 'bg-muted' : ''}
                  `}
                >
                  {date.getDate()}
                  {status === 'completed' && (
                    <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
                  )}
                  {status === 'scheduled' && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500/20" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-muted-foreground">Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span className="text-muted-foreground">Rest Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Today&apos;s Schedule</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{workoutPlan?.name ?? 'Upper Body Push'}</p>
              <p className="text-sm text-muted-foreground">
                {firstWorkout?.exercises.length ?? 6} exercises - {workoutPlan?.estimatedDuration ?? 45} min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
