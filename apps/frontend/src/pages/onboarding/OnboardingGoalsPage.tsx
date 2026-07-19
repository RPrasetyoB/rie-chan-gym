import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { formatGoalLabel } from '@/lib/recommendationEngine'
import { saveOnboardingGoals } from '@/lib/onboardingStorage'

const GOALS = [
  { id: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
  { id: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
  { id: 'fat_loss', label: 'Fat Loss', icon: '⚡' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'mobility', label: 'Mobility', icon: '🤸' },
  { id: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { id: 'general_fitness', label: 'General Fitness', icon: '❤️' },
  { id: 'better_posture', label: 'Better Posture', icon: '🧍' },
  { id: 'improve_stamina', label: 'Improve Stamina (sex stamina)', icon: '⚡' },
  { id: 'cardiovascular', label: 'Cardiovascular Fitness', icon: '💓' },
  { id: 'core_strength', label: 'Core Strength', icon: '🎯' },
  { id: 'hip_mobility', label: 'Hip Mobility', icon: '🦵' },
  { id: 'pelvic_floor', label: 'Pelvic Floor Strength', icon: '🌸' },
]

export default function OnboardingGoalsPage() {
  const navigate = useNavigate()
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  const focusSummary = [
    {
      title: 'Strength focus',
      matches: ['strength', 'build_muscle', 'general_fitness'],
      description: 'Compound lifts, progressive overload, and higher training density.',
    },
    {
      title: 'Conditioning focus',
      matches: ['lose_weight', 'fat_loss', 'endurance', 'cardiovascular', 'improve_stamina'],
      description: 'More total work, cleaner pacing, and conditioning-friendly set ranges.',
    },
    {
      title: 'Mobility / posture focus',
      matches: ['mobility', 'flexibility', 'hip_mobility', 'better_posture'],
      description: 'Mobility, movement quality, and back/core support work.',
    },
    {
      title: 'Core / pelvic floor focus',
      matches: ['core_strength', 'pelvic_floor'],
      description: 'Core stability, anti-rotation work, and pelvic control drills.',
    },
  ].filter((item) => item.matches.some((goal) => selectedGoals.includes(goal)))

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleSubmit = () => {
    if (selectedGoals.length === 0) {
      alert('Please select at least one goal!')
      return
    }
    saveOnboardingGoals(selectedGoals)
    navigate('/onboarding/complete')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 safe-area-top safe-area-bottom">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <RieChanAvatar size={64} pose="point" />
          <h1 className="font-display text-2xl font-bold mt-4">What are your goals?</h1>
          <p className="text-muted-foreground text-sm">Select all that apply - you can have multiple goals!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id)
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">How your goals shape the plan</p>
                <p className="text-xs text-muted-foreground">{selectedGoals.length} chosen</p>
              </div>
              {focusSummary.length > 0 ? (
                <div className="space-y-3">
                  {focusSummary.map((item) => (
                    <div key={item.title} className="rounded-lg border border-border bg-secondary/40 p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.matches
                          .filter((goal) => selectedGoals.includes(goal))
                          .map((goal) => (
                            <span key={goal} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                              {formatGoalLabel(goal)}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Select one or more goals and I&apos;ll show how they steer your weekly training focus.
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> You can always adjust your goals later in your profile settings!
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/onboarding/profile')}
              >
                Back
              </Button>
              <Button 
                type="button" 
                className="flex-1"
                onClick={handleSubmit}
                disabled={selectedGoals.length === 0}
              >
                Continue ({selectedGoals.length} selected)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
