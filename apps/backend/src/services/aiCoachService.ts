import { createHash } from 'node:crypto'
import { env } from '../config/env.js'
import { exerciseCatalog } from '../data/exercises.js'
import type { PersistedProfile } from './profileDbService.js'
import { COACH_SYSTEM_PROMPT } from './aiCoachPrompt.js'

type CoachMessage = {
  role: 'user' | 'assistant'
  content: string
}

type CoachIntent = 'routine' | 'nutrition' | 'bodyMetrics' | 'recovery' | 'exerciseAdvice' | 'general'

type CoachContext = {
  profile?: PersistedProfile | null
}

type CachedContentResponse = {
  name?: string
}

let cachedPromptName: string | null = null
let cachedPromptHash: string | null = null
let cachedPromptPromise: Promise<string | null> | null = null

function getGeminiApiKey() {
  return env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? env.AI_PROVIDER_API_KEY
}

function getModelName() {
  return env.AI_PROVIDER_MODEL.startsWith('models/') ? env.AI_PROVIDER_MODEL : `models/${env.AI_PROVIDER_MODEL}`
}

function getFallbackModelName() {
  return 'models/gemini-2.5-flash'
}

function getCachedPromptKey() {
  return createHash('sha256').update(`${getModelName()}\n${COACH_SYSTEM_PROMPT}`).digest('hex')
}

async function ensurePromptCache() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const currentHash = getCachedPromptKey()
  if (cachedPromptName && cachedPromptHash === currentHash) {
    return cachedPromptName
  }

  if (cachedPromptPromise && cachedPromptHash === currentHash) {
    return cachedPromptPromise
  }

  cachedPromptHash = currentHash
  cachedPromptPromise = (async () => {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/cachedContents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: getModelName(),
        displayName: 'rie-chan-coach-system-prompt',
        systemInstruction: {
          parts: [{ text: COACH_SYSTEM_PROMPT }],
        },
        ttl: `${env.AI_PROMPT_CACHE_TTL_SECONDS}s`,
      }),
    })

    if (!response.ok) {
      const rawBody = await response.text().catch(() => '')
      throw new Error(rawBody || 'Failed to create prompt cache')
    }

    const payload = (await response.json()) as CachedContentResponse
    return payload.name ?? null
  })().catch(() => null)

  cachedPromptName = await cachedPromptPromise
  return cachedPromptName
}

function looksLikePainOrInjuryQuestion(prompt: string) {
  const lower = prompt.toLowerCase()
  const painTerms = [
    'hurt',
    'hurts',
    'pain',
    'sore',
    'soreness',
    'injury',
    'injured',
    'swollen',
    'swelling',
    'ache',
    'aching',
  ]
  const bodyParts = [
    'knee',
    'ankle',
    'back',
    'shoulder',
    'elbow',
    'wrist',
    'shin',
    'foot',
    'arm',
    'forearm',
    'bicep',
    'tricep',
    'upper arm',
    'hand',
  ]

  const hasPainTerm = painTerms.some((term) => lower.includes(term))
  const hasBodyPart = bodyParts.some((part) => new RegExp(`\\b${part}\\b`).test(lower))

  return hasPainTerm && hasBodyPart
}

function buildSafetyReply(prompt: string) {
  const lower = prompt.toLowerCase()
  const isRedFlag =
    lower.includes('sharp') ||
    lower.includes('swollen') ||
    lower.includes('swelling') ||
    lower.includes('numb') ||
    lower.includes('dizzy') ||
    lower.includes('chest pain') ||
    lower.includes('can barely') ||
    lower.includes('cannot walk') ||
    lower.includes('worsening')

  if (isRedFlag) {
    return [
      'Stop the workout and get checked by a healthcare professional.',
      'Do not push through sharp, worsening, or swollen pain.',
      'If it is severe or you cannot bear weight normally, seek urgent care.',
    ].join(' ')
  }

  const armArea = ['arm', 'forearm', 'bicep', 'tricep', 'upper arm', 'wrist', 'elbow', 'shoulder'].some((part) =>
    lower.includes(part),
  )

  if (armArea) {
    return [
      'Back off upper-body training for 24-48 hours and keep the arm moving only in pain-free ranges.',
      'If it feels like normal muscle soreness, use light movement, easy stretching, and reduce the load next session.',
      'If it is sharp, swollen, weak, numb, or getting worse, stop training and get it checked by a clinician.',
      'Was it a sore muscle feeling or a sharp pain?',
    ].join(' ')
  }

  return [
    'Back off the painful movement for today and keep the area moving only if it stays comfortable.',
    'If it feels like normal soreness, use light movement, easier loads, and a longer warm-up next time.',
    'If it is sharp, swollen, weak, numb, or not improving, stop training and get it checked.',
    'Is it a dull soreness or a sharper pain?',
  ].join(' ')
}

function getConversationText(prompt: string, messages?: CoachMessage[]) {
  return [prompt, ...(messages ?? []).map((message) => message.content)].join(' ').toLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text))
}

function looksClearlyOutOfScope(prompt: string) {
  const latest = prompt.toLowerCase().trim()
  const fitnessTerms = [
    'workout',
    'exercise',
    'training',
    'routine',
    'gym',
    'calisthenics',
    'bodyweight',
    'cardio',
    'strength',
    'muscle',
    'fat loss',
    'weight loss',
    'bulk',
    'cut',
    'protein',
    'calorie',
    'bmi',
    'body fat',
    'recovery',
    'sleep',
    'mobility',
    'stretch',
    'injury',
    'pain',
    'sore',
    'push up',
    'pull up',
    'squat',
    'deadlift',
    'bench press',
    'run',
    'walk',
  ]
  const hardOutOfScopeTerms = [
    'code',
    'coding',
    'programming',
    'javascript',
    'typescript',
    'python',
    'react',
    'database',
    'sql',
    'prisma',
    'api',
    'vercel',
    'supabase',
    'deploy',
    'stock',
    'crypto',
    'bitcoin',
    'finance',
    'investment',
    'politic',
    'election',
    'president',
    'prime minister',
    'movie',
    'anime',
    'game',
    'homework',
    'essay',
    'capital city',
    'weather forecast',
  ]
  const softOutOfScopeTerms = ['weather', 'travel', 'restaurant', 'shopping', 'recipe']

  if (containsAnyTerm(latest, hardOutOfScopeTerms)) return true
  if (containsAnyTerm(latest, softOutOfScopeTerms) && !containsAnyTerm(latest, fitnessTerms)) return true

  return false
}

function buildOutOfScopeReply() {
  return [
    'I can help with workouts, exercise form, training plans, calories, BMI, body weight, recovery, and non-medical healthy habits.',
    'For that topic, use another assistant. Tell me your fitness goal, available equipment, or what you want to improve, and I can help from there.',
  ].join(' ')
}

function inferCoachIntent(prompt: string, messages?: CoachMessage[]): CoachIntent {
  const latest = prompt.toLowerCase()
  const context = getConversationText(prompt, messages)
  const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term))
  const asksToMake = /\b(make|create|build|give|write|design|plan)\b/.test(latest)
  const planLanguage = hasAny(context, ['workout plan', 'training plan', 'exercise plan', 'routine', 'program', 'split', 'schedule'])
  const trainingLanguage = hasAny(context, ['workout', 'training', 'exercise', 'gym', 'calisthenics', 'bodyweight', 'strength', 'muscle', 'endurance', 'mobility'])

  if ((planLanguage && trainingLanguage) || (asksToMake && hasAny(latest, ['workout', 'training', 'routine', 'program', 'plan']))) {
    return 'routine'
  }

  if (hasAny(context, ['calorie', 'protein', 'macro', 'meal', 'diet', 'nutrition', 'eat', 'bulk', 'cut'])) {
    return 'nutrition'
  }

  if (hasAny(context, ['bmi', 'body fat', 'goal weight', 'maintenance', 'tdee', 'weight target'])) {
    return 'bodyMetrics'
  }

  if (hasAny(context, ['recovery', 'rest day', 'sleep', 'sore', 'fatigue', 'deload'])) {
    return 'recovery'
  }

  if (hasAny(context, ['form', 'technique', 'how to do', 'alternative', 'replace', 'swap'])) {
    return 'exerciseAdvice'
  }

  return 'general'
}

function buildIntentInstruction(intent: CoachIntent) {
  if (intent === 'routine') {
    return [
      'The user wants a workout plan or routine.',
      'Use the full conversation to infer their goal, available equipment, level, schedule, and constraints.',
      'Do not answer with only confirmation or motivation.',
      'Give a concrete routine with days or sessions, exercises, sets, reps or time, rest guidance, and simple progression.',
      'If details are missing, choose a sensible beginner-friendly default and ask at most one short follow-up after the usable plan.',
    ].join(' ')
  }

  if (intent === 'nutrition') {
    return 'The user wants nutrition coaching. Give practical food, calorie, protein, or habit guidance with clear next steps.'
  }

  if (intent === 'bodyMetrics') {
    return 'The user wants body-metric guidance. Explain the metric simply and connect it to practical training or nutrition choices.'
  }

  if (intent === 'recovery') {
    return 'The user wants recovery coaching. Give specific rest, sleep, training-load, and next-session guidance.'
  }

  if (intent === 'exerciseAdvice') {
    return 'The user wants exercise advice. Give clear technique, substitution, or programming guidance that can be used immediately.'
  }

  return ''
}

function formatProfileContext(context?: CoachContext) {
  const profile = context?.profile
  if (!profile) return ''

  const details = [
    profile.goals.length > 0 ? `goals: ${profile.goals.join(', ')}` : '',
    profile.equipment ? `equipment: ${profile.equipment}` : '',
    `experience: ${profile.experienceLevel}`,
    `preferred schedule: ${profile.workoutDays} days/week, ${profile.sessionDuration} minutes/session`,
    profile.activityLevel ? `activity: ${profile.activityLevel}` : '',
    profile.injuries ? `injuries or limits: ${profile.injuries}` : '',
  ].filter(Boolean)

  return details.length > 0
    ? `Saved user profile context, use it when relevant and do not mention it unless it helps the answer: ${details.join('; ')}.`
    : ''
}

function buildCoachInstruction(prompt: string, messages?: CoachMessage[], context?: CoachContext, extraInstruction?: string) {
  const lower = getConversationText(prompt, messages)
  const intentInstruction = buildIntentInstruction(inferCoachIntent(prompt, messages))
  const profileContext = formatProfileContext(context)
  const lines = [
    'Answer like a practical fitness coach with a calm, natural voice.',
    'Answer the latest user message directly and do not start with praise or filler.',
    'Be specific, concise, and genuinely helpful.',
    'Avoid repeating the user unless it helps clarify the answer.',
    'Do not sound templated or overly cheerful.',
  ]

  if (
    lower.includes('beginner') &&
    (lower.includes('workout') || lower.includes('workouts') || lower.includes('training') || lower.includes('routine') || lower.includes('plan'))
  ) {
    lines.push('The user wants a beginner workout plan. Give a real starter routine with exercises, sets, reps, days per week, and simple progression.')
  } else if (
    lower.includes('fat loss') ||
    lower.includes('lose fat') ||
    lower.includes('weight loss') ||
    lower.includes('cut')
  ) {
    lines.push('The user wants fat-loss coaching. Give practical nutrition and training advice, not motivation fluff.')
  } else if (
    lower.includes('muscle gain') ||
    lower.includes('build muscle') ||
    lower.includes('gain muscle') ||
    lower.includes('bulk')
  ) {
    lines.push('The user wants muscle-gain coaching. Give practical training and recovery advice, not motivation fluff.')
  } else if (looksLikePainOrInjuryQuestion(prompt)) {
    lines.push('The user mentions pain or injury. Give a safety-first response with clear next steps and avoid diagnosis.')
  }

  if (intentInstruction) {
    lines.push(intentInstruction)
  }

  if (profileContext) {
    lines.push(profileContext)
  }

  lines.push('If a routine is requested, make it concrete. If advice is requested, make it immediately actionable.')

  if (extraInstruction) {
    lines.push(extraInstruction)
  }

  return lines.join(' ')
}

function buildContents(prompt: string, messages?: CoachMessage[], context?: CoachContext, extraInstruction?: string) {
  const recent = (messages ?? []).slice(-8)
  const transcript = recent.length > 0 ? recent : [{ role: 'user' as const, content: prompt.trim() }]

  return [
    {
      role: 'user',
      parts: [{ text: buildCoachInstruction(prompt, messages, context, extraInstruction) }],
    },
    ...transcript.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content.trim() }],
    })),
  ]
}

function isQuotaError(rawBody: string) {
  try {
    const payload = JSON.parse(rawBody) as {
      error?: {
        code?: number
        status?: string
      }
    }

    return payload.error?.code === 429 || payload.error?.status === 'RESOURCE_EXHAUSTED'
  } catch {
    return rawBody.includes('RESOURCE_EXHAUSTED') || rawBody.includes('Quota exceeded')
  }
}

async function generateContent(
  modelName: string,
  apiKey: string,
  cachedContent: string | null,
  prompt: string,
  messages?: CoachMessage[],
  context?: CoachContext,
  extraInstruction?: string,
) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: buildContents(prompt, messages, context, extraInstruction),
      ...(cachedContent ? { cachedContent } : {}),
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 768,
      },
    }),
  })

  if (!response.ok) {
    const rawBody = await response.text().catch(() => '')
    throw new Error(rawBody || 'Gemini request failed')
  }

  return response.json()
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''

  const response = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  return response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim() ?? ''
}

function looksGenericReply(text: string) {
  const cleaned = text.trim().toLowerCase()
  return (
    cleaned.length < 80 ||
    /^that's fantastic/i.test(cleaned) ||
    /^absolutely/i.test(cleaned) ||
    /^okay/i.test(cleaned) ||
    /^great question/i.test(cleaned) ||
    /^that's a fantastic question/i.test(cleaned)
  )
}

function looksIncompleteReply(text: string) {
  const cleaned = text.trim().toLowerCase()
  return /(?:\b(and|or|to|for|with|because|while|but|so)\s*)$/.test(cleaned) || !/[.!?]$/.test(cleaned)
}

function looksWeakRoutineReply(text: string) {
  const cleaned = text.trim().toLowerCase()
  const hasStructure = /\b(day|week|session|routine|upper|lower|full body|push|pull|legs)\b/.test(cleaned)
  const hasPrescription = /\b\d+\s*(sets?|x)\b/.test(cleaned) && /\b(reps?|seconds?|sec|minutes?|min)\b/.test(cleaned)
  const hasExercise =
    /\b(push|pull|squat|lunge|row|press|curl|deadlift|plank|raise|dip|run|walk|bike|stretch|mobility)\b/.test(cleaned)

  return !hasStructure || !hasPrescription || !hasExercise
}

export async function generateCoachReply(prompt: string, messages?: CoachMessage[], context?: CoachContext) {
  if (looksLikePainOrInjuryQuestion(prompt)) {
    return buildSafetyReply(prompt)
  }

  if (looksClearlyOutOfScope(prompt)) {
    return buildOutOfScopeReply()
  }

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const cachedContent = await ensurePromptCache().catch(() => null)
  const primaryModel = getModelName()
  const fallbackModel = getFallbackModelName()
  const modelSequence = primaryModel === fallbackModel ? [primaryModel] : [primaryModel, fallbackModel]

  let payload: unknown = null
  let lastError = ''

  for (const modelName of modelSequence) {
    try {
      payload = await generateContent(modelName, apiKey, cachedContent, prompt, messages, context)
      lastError = ''
      break
    } catch (error) {
      const rawBody = error instanceof Error ? error.message : String(error)
      const canFallback = modelName === primaryModel && modelName !== fallbackModel && isQuotaError(rawBody)

      if (canFallback) {
        continue
      }

      try {
        const parsed = rawBody ? (JSON.parse(rawBody) as { error?: unknown }) : null
        lastError =
          parsed && typeof parsed === 'object' && 'error' in parsed
            ? JSON.stringify(parsed.error)
            : rawBody
      } catch {
        lastError = rawBody
      }

      break
    }
  }

  if (!payload) {
    throw new Error(lastError || 'Gemini request failed')
  }

  let text = extractResponseText(payload)
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  const intent = inferCoachIntent(prompt, messages)
  const needsConcreteRoutine = intent === 'routine' && looksWeakRoutineReply(text)

  if (looksGenericReply(text) || needsConcreteRoutine) {
    const retryPayload = await generateContent(
      primaryModel,
      apiKey,
      cachedContent,
      prompt,
      messages,
      context,
      needsConcreteRoutine
        ? [
            'The previous answer did not satisfy a routine request.',
            'Rewrite it as a concrete workout plan that uses the user goal and constraints from the conversation.',
            'Include days or sessions, exercises, sets, reps or time, rest guidance, and progression.',
            'Do not only confirm, summarize, or ask questions.',
          ].join(' ')
        : 'The previous answer was too generic. Rewrite it so it directly answers the user with specific coaching, concrete details, and no praise or filler.',
    ).catch(() => null)

    const retryText = retryPayload ? extractResponseText(retryPayload) : ''
    if (retryText && !looksGenericReply(retryText) && (intent !== 'routine' || !looksWeakRoutineReply(retryText))) {
      text = retryText
    }
  }

  if (looksIncompleteReply(text)) {
    const retryPayload = await generateContent(
      primaryModel,
      apiKey,
      cachedContent,
      prompt,
      messages,
      context,
      'The previous answer ended too early. Continue and finish the response in complete sentences, without repeating the opening.',
    ).catch(() => null)

    const retryText = retryPayload ? extractResponseText(retryPayload) : ''
    if (retryText && retryText.length > text.length && !looksIncompleteReply(retryText)) {
      text = retryText
    }
  }

  return text
}

export function modifyWorkout(constraint: string) {
  const lower = constraint.toLowerCase()

  if (lower.includes('no bench')) {
    return {
      summary: 'Bench Press swapped for Dumbbell Press and Push Ups.',
      exercises: exerciseCatalog.filter((exercise) => ['incline_db_press', 'push_up'].includes(exercise.id)),
    }
  }

  if (lower.includes('no cable')) {
    return {
      summary: 'Cable work swapped for dumbbell and bodyweight variations.',
      exercises: exerciseCatalog.filter((exercise) => ['incline_db_press', 'lateral_raise', 'bicep_curl'].includes(exercise.id)),
    }
  }

  return {
    summary: 'Kept the plan structure and adjusted for your constraint.',
    exercises: exerciseCatalog.slice(0, 3),
  }
}

export function analyzeProgress() {
  return {
    summary: 'Your pushing strength is trending up. Keep the same exercise selection and add small load jumps when reps feel steady.',
    confidence: 'medium',
  }
}

export function recoveryAdvice() {
  return {
    score: 74,
    summary: 'Recovery looks solid. One mobility or rest day would keep your weekly quality high.',
  }
}

export function nutritionAdvice() {
  return {
    calories: 2200,
    summary: 'Try a small carb increase today to support recovery and training performance.',
  }
}
