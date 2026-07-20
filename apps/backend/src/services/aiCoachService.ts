import { createHash } from 'node:crypto'
import { env } from '../config/env.js'
import { exerciseCatalog } from '../data/exercises.js'
import { COACH_SYSTEM_PROMPT } from './aiCoachPrompt.js'

type CoachMessage = {
  role: 'user' | 'assistant'
  content: string
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

function buildCoachInstruction(prompt: string, extraInstruction?: string) {
  const lower = prompt.toLowerCase()
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

  lines.push('If a routine is requested, make it concrete. If advice is requested, make it immediately actionable.')

  if (extraInstruction) {
    lines.push(extraInstruction)
  }

  return lines.join(' ')
}

function buildContents(prompt: string, messages?: CoachMessage[], extraInstruction?: string) {
  const recent = (messages ?? []).slice(-8)
  const transcript = recent.length > 0 ? recent : [{ role: 'user' as const, content: prompt.trim() }]

  return [
    {
      role: 'user',
      parts: [{ text: buildCoachInstruction(prompt, extraInstruction) }],
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
  extraInstruction?: string,
) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: buildContents(prompt, messages, extraInstruction),
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

export async function generateCoachReply(prompt: string, messages?: CoachMessage[]) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  if (looksLikePainOrInjuryQuestion(prompt)) {
    return buildSafetyReply(prompt)
  }

  const cachedContent = await ensurePromptCache().catch(() => null)
  const primaryModel = getModelName()
  const fallbackModel = getFallbackModelName()
  const modelSequence = primaryModel === fallbackModel ? [primaryModel] : [primaryModel, fallbackModel]

  let payload: unknown = null
  let lastError = ''

  for (const modelName of modelSequence) {
    try {
      payload = await generateContent(modelName, apiKey, cachedContent, prompt, messages)
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

  if (looksGenericReply(text)) {
    const retryPayload = await generateContent(
      primaryModel,
      apiKey,
      cachedContent,
      prompt,
      messages,
      'The previous answer was too generic. Rewrite it so it directly answers the user with specific coaching, concrete details, and no praise or filler.',
    ).catch(() => null)

    const retryText = retryPayload ? extractResponseText(retryPayload) : ''
    if (retryText && !looksGenericReply(retryText)) {
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
