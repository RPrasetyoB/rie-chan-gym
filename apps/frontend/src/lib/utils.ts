import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`
}

export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100
  if (!heightInMeters || !Number.isFinite(heightInMeters)) return 0
  return weight / (heightInMeters * heightInMeters)
}

export type BMIStatus = 'underweight' | 'normal' | 'overweight' | 'obese'

export function getBMIStatus(weight: number, heightCm: number): { bmi: number; status: BMIStatus; label: string; recommendation: string } {
  const bmi = calculateBMI(weight, heightCm)

  if (bmi === 0) {
    return {
      bmi,
      status: 'normal',
      label: 'Unknown',
      recommendation: 'Share your height and weight so I can tailor your plan.',
    }
  }

  if (bmi < 18.5) {
    return {
      bmi,
      status: 'underweight',
      label: 'Underweight',
      recommendation: 'Prioritize strength work, enough calories, and slow progression so you can build a healthier frame.',
    }
  }

  if (bmi < 25) {
    return {
      bmi,
      status: 'normal',
      label: 'Healthy range',
      recommendation: 'Keep the balance: mixed strength, conditioning, and recovery is the best fit.',
    }
  }

  if (bmi < 30) {
    return {
      bmi,
      status: 'overweight',
      label: 'Overweight',
      recommendation: 'Focus on low-impact conditioning, consistent strength training, and steady progress over crash dieting.',
    }
  }

  return {
    bmi,
    status: 'obese',
    label: 'Obese',
    recommendation: 'Start with joint-friendly conditioning, manageable strength sets, and a sustainable calorie deficit.',
  }
}

export type FitWeightTarget = {
  status: 'unknown' | BMIStatus
  rangeKg: [number, number] | null
  targetKg: number | null
  label: string
  recommendation: string
}

export function getFitWeightTarget(weight: number, heightCm: number): FitWeightTarget {
  const bmi = calculateBMI(weight, heightCm)
  const heightM = heightCm / 100

  if (!heightM || !Number.isFinite(heightM) || bmi === 0) {
    return {
      status: 'unknown' as const,
      rangeKg: null,
      targetKg: null,
      label: 'Fit weight target',
      recommendation: 'Share your height and weight to get a fit-weight target.',
    }
  }

  const healthyMin = 18.5 * heightM * heightM
  const healthyMax = 24.9 * heightM * heightM
  const targetKg = roundToOneDecimal((healthyMin + healthyMax) / 2)
  const rangeLabel = `${roundToOneDecimal(healthyMin)} - ${roundToOneDecimal(healthyMax)} kg`

  if (bmi < 18.5) {
    const rangeKg: [number, number] = [roundToOneDecimal(healthyMin), roundToOneDecimal(healthyMax)]
    return {
      status: 'underweight' as const,
      rangeKg,
      targetKg,
      label: 'Need more weight',
      recommendation: `A fit-weight target is about ${rangeLabel}. Aim to gain slowly with strength training, enough calories, and steady sleep.`,
    }
  }

  if (bmi >= 25) {
    const rangeKg: [number, number] = [roundToOneDecimal(healthyMin), roundToOneDecimal(healthyMax)]
    return {
      status: bmi < 30 ? ('overweight' as const) : ('obese' as const),
      rangeKg,
      targetKg,
      label: 'Fit weight target',
      recommendation: `A fit-weight target is about ${rangeLabel}. Build toward it with strength work, low-impact conditioning, and steady calorie control.`,
    }
  }

  const rangeKg: [number, number] = [roundToOneDecimal(healthyMin), roundToOneDecimal(healthyMax)]
  return {
    status: 'normal' as const,
    rangeKg,
    targetKg,
    label: 'Fit weight range',
    recommendation: `You are already in the healthy range. A fit-weight target is about ${rangeLabel}, with ${targetKg.toFixed(1)} kg as a rough center point.`,
  }
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else if (gender === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161
  }

  return 10 * weight + 6.25 * height - 5 * age - 78
}

export function calculateDailyCalories(
  bmr: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return Math.round(bmr * multipliers[activityLevel])
}
