import { useEffect, useMemo, useState } from 'react'
import { Search, Dumbbell, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiGet } from '@/lib/api'
import { getExerciseMedia } from '@/lib/exerciseMedia'
import { BODY_PART_ORDER, deriveBodyParts } from '@/lib/exerciseTaxonomy'

interface Exercise {
  id: string
  name: string
  category: string
  difficulty: string
  equipment: string
  muscleGroups: string[]
  bodyParts?: string[]
  gifUrl?: string
}

const EQUIPMENT_ORDER = ['Bodyweight', 'Dumbbell', 'Barbell', 'Band', 'Cable', 'Machine', 'Rope', 'Stationary Bike', 'Elliptical']

function uniqueBodyParts(exercise: Exercise) {
  return Array.from(new Set(exercise.bodyParts?.length ? exercise.bodyParts : deriveBodyParts(exercise)))
}

export default function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadExercises = async () => {
    try {
      const response = await apiGet<{ exercises: Exercise[] }>('/exercises')
      setExercises(response.exercises)
      setLastUpdated(new Date())
    } catch {
      setExercises([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()

    const timer = window.setInterval(() => {
      loadExercises()
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  const normalizedExercises = useMemo(
    () =>
      exercises.map((exercise) => ({
        ...exercise,
        difficulty:
          exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1),
        equipment: exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1),
      })),
    [exercises],
  )

  const normalizeEquipment = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

  const categories = useMemo(
    () => ['All', ...BODY_PART_ORDER],
    [],
  )

  const equipmentLabel = useMemo(() => {
    if (selectedEquipments.length === 0) return 'Any equipment'
    if (selectedEquipments.length === 1) return selectedEquipments[0]
    return `${selectedEquipments.length} equipment filters`
  }, [selectedEquipments])

  const filteredExercises = normalizedExercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    const bodyParts = uniqueBodyParts(exercise)
    const matchesCategory = selectedCategory === 'All' || bodyParts.includes(selectedCategory)
    const matchesEquipment =
      selectedEquipments.length === 0 ||
      selectedEquipments.some((equipment) =>
        normalizeEquipment(exercise.equipment).includes(normalizeEquipment(equipment)),
      )
    return matchesSearch && matchesCategory && matchesEquipment
  })

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipments((current) =>
      current.includes(equipment)
        ? current.filter((item) => item !== equipment)
        : [...current, equipment],
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Exercise Library</h1>
          <p className="text-sm text-muted-foreground">
            {normalizedExercises.length} movements ready for your program
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadExercises} aria-label="Refresh exercises">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Body Parts
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={[
                'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 transition-colors',
                selectedCategory === category
                  ? 'border-primary bg-primary/15 text-primary hover:bg-primary/20'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
              ].join(' ')}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Equipment
        </div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{equipmentLabel}</span>
          <button
            type="button"
            onClick={() => setSelectedEquipments([])}
            className="font-medium text-primary hover:underline"
          >
            Clear
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EQUIPMENT_ORDER.map((equipment) => {
            const checked = selectedEquipments.includes(equipment)
            return (
              <label
                key={equipment}
                className={[
                  'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors',
                  checked
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEquipment(equipment)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="whitespace-nowrap">{equipment}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="mb-4 text-xs text-muted-foreground">
        {isLoading ? 'Syncing live exercise catalog...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Catalog ready'}
      </div>

      <div className="space-y-3">
        {filteredExercises.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isLoading ? 'Loading exercises...' : 'No exercises found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-secondary/40 border border-border">
                    {(exercise.gifUrl ?? getExerciseMedia(exercise.id, exercise.name)?.gifUrl) ? (
                      <img
                        src={exercise.gifUrl ?? getExerciseMedia(exercise.id, exercise.name)?.gifUrl}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-center text-xs text-muted-foreground px-2">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{exercise.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {exercise.category}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-secondary">
                        {exercise.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-secondary">
                        {exercise.equipment}
                      </span>
                      {uniqueBodyParts(exercise)
                        .filter((part) => part !== exercise.category)
                        .map((part) => (
                          <span key={part} className="px-2 py-1 rounded-full bg-secondary/70 text-muted-foreground">
                            {part}
                          </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2 text-xs text-muted-foreground">
                      {exercise.muscleGroups.map((muscle) => (
                        <span key={muscle}>{muscle}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
