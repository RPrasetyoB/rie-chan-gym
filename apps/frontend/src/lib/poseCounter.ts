export type CameraTrackingMode = 'squat' | 'push_up' | 'curl' | 'sit_up' | 'side_bend' | 'hinge' | 'raise' | 'hold'

export interface PoseLandmark {
  x: number
  y: number
  z?: number
  visibility?: number
  presence?: number
}

export interface RepTrackerState {
  phase: 'up' | 'down'
  reps: number
}

export interface PosePoint {
  x: number
  y: number
  visibility?: number
  presence?: number
}

type LandmarkPair = [number, number, number]

const VISIBILITY_THRESHOLD = 0.2

const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [23, 27],
  [24, 28],
]

const MODE_LABELS: Record<CameraTrackingMode, string> = {
  squat: 'squat',
  push_up: 'push-up',
  curl: 'curl',
  sit_up: 'sit-up',
  side_bend: 'side bend',
  hinge: 'hip hinge',
  raise: 'shoulder raise',
  hold: 'timer',
}

const MODE_HINTS: Record<CameraTrackingMode, string> = {
  squat: 'Stand tall, sink down, then come back to standing to count one rep.',
  push_up: 'Lower your chest, then press back to the top.',
  curl: 'Let the elbows bend fully, then return the arms to the top position.',
  sit_up: 'Curl your torso up, then lower with control.',
  side_bend: 'Lean to the side, then return upright to finish one rep.',
  hinge: 'Hinge at the hips, then return to a tall standing position.',
  raise: 'Lift your arms with control, then lower them back down.',
  hold: 'Use this mode as a timer for holds, cardio, or mobility work.',
}

export function createRepTrackerState(): RepTrackerState {
  return {
    phase: 'up',
    reps: 0,
  }
}

export function getCameraTrackingMode(exerciseId?: string, exerciseName?: string): CameraTrackingMode | null {
  const key = normalizeExerciseKey(`${exerciseId ?? ''} ${exerciseName ?? ''}`)

  if (/\b(lateral raise|front raise|rear delt raise|face pull|reverse fly|y raise|upright row|shoulder raise)\b/.test(key)) {
    return 'raise'
  }

  if (/\b(plank|side plank|walk|walking|run|sprint|bike|jump rope|air bike|stationary bike|elliptical|burpee|mountain climber|bear crawl|wheel run|star jump|high knees|stretch|mobility|flexibility|circles|rotation|internal rotation)\b/.test(key)) {
    return 'hold'
  }

  const scoredModes: Array<[CameraTrackingMode, number]> = [
    ['hinge', scoreMatch(key, [
      /\b(deadlift|romanian deadlift|straight leg deadlift|good morning|hip thrust|glute bridge|bridge|pull through|back extension|hip extension)\b/,
    ])],
    ['push_up', scoreMatch(key, [
      /\b(push up|pushup|bench press|chest dip|dip|overhead press|shoulder press|triceps extension|pushdown|jm bench press|press)\b/,
    ])],
    ['raise', scoreMatch(key, [
      /\b(fly|lateral raise|front raise|rear delt raise|face pull|reverse fly|y raise|upright row)\b/,
    ])],
    ['curl', scoreMatch(key, [
      /\b(curl|bicep|biceps|pulldown|pull up|chin up|row|lat|rear delt row|preacher curl|drag curl|concentration curl)\b/,
    ])],
    ['squat', scoreMatch(key, [
      /\b(squat|split squat|lunge|step up|leg press|calf raise|jump)\b/,
    ])],
    ['sit_up', scoreMatch(key, [
      /\b(sit up|situp|crunch|knee raise|leg raise|v up|v-up|rollout|rollerout|pelvic tilt|reverse crunch|jack knife|hanging knee raise|twist|oblique|pallof|side bend)\b/,
    ])],
  ]

  scoredModes.sort((left, right) => right[1] - left[1])

  const [bestMode, bestScore] = scoredModes[0]
  if (bestScore > 0) {
    return bestMode
  }

  return 'hold'
}

export function getCameraModeLabel(mode: CameraTrackingMode | null) {
  return mode ? MODE_LABELS[mode] : 'movement'
}

export function getCameraModeHint(mode: CameraTrackingMode | null) {
  return mode ? MODE_HINTS[mode] : 'Camera rep counting is only tuned for a few movements right now.'
}

export function measurePoseValue(mode: CameraTrackingMode, landmarks: PosePoint[]) {
  if (mode === 'raise') {
    return getArmLiftValue(landmarks)
  }

  if (mode === 'sit_up') {
    return getTorsoLeanAngle(landmarks)
  }

  const pairs = getAnglePairs(mode)
  const values = pairs
    .map(([a, b, c]) => angleBetween(landmarks[a], landmarks[b], landmarks[c]))
    .filter((value): value is number => value !== null)

  if (values.length === 0) return null

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: PosePoint[],
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)

  if (landmarks.length === 0) {
    return false
  }

  ctx.save()
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.95)'
  ctx.fillStyle = 'rgba(96, 165, 250, 0.95)'

  for (const [start, end] of SKELETON_CONNECTIONS) {
    const a = landmarks[start]
    const b = landmarks[end]
    const visibility = Math.max(a?.visibility ?? a?.presence ?? 0, b?.visibility ?? b?.presence ?? 0)
    if (!a || !b || visibility < VISIBILITY_THRESHOLD) continue

    ctx.beginPath()
    ctx.moveTo(mirrorX(a.x, width), a.y * height)
    ctx.lineTo(mirrorX(b.x, width), b.y * height)
    ctx.globalAlpha = Math.max(0.25, Math.min(1, visibility))
    ctx.stroke()
  }

  for (const point of landmarks) {
    if (!point) continue
    const visibility = point.visibility ?? point.presence ?? 0
    if (visibility < VISIBILITY_THRESHOLD) continue

    ctx.beginPath()
    ctx.arc(mirrorX(point.x, width), point.y * height, 4, 0, Math.PI * 2)
    ctx.globalAlpha = Math.max(0.25, Math.min(1, visibility))
    ctx.fill()
  }

  ctx.restore()
  return true
}

export function advanceRepTracker(
  mode: CameraTrackingMode,
  landmarks: PoseLandmark[],
  previous: RepTrackerState,
) {
  const angle = measurePoseValue(mode, landmarks)
  const confidence = getTrackedConfidence(mode, landmarks)

  if (angle == null) {
    return {
      state: previous,
      repAdded: false,
      confidence,
    }
  }

  const thresholds = getThresholds(mode)
  let phase = previous.phase
  let reps = previous.reps

  if (angle <= thresholds.down) {
    phase = 'down'
  }

  if (previous.phase === 'down' && angle >= thresholds.up) {
    reps += 1
    phase = 'up'
  }

  return {
    state: {
      phase,
      reps,
    },
    repAdded: reps > previous.reps,
    confidence,
  }
}

function getTrackedConfidence(mode: CameraTrackingMode, landmarks: PoseLandmark[]) {
  const pairs = getAnglePairs(mode)
  const points = new Set<number>()

  for (const [a, b, c] of pairs) {
    points.add(a)
    points.add(b)
    points.add(c)
  }

  const values = [...points]
    .map((index) => landmarks[index]?.visibility ?? landmarks[index]?.presence ?? 0)
    .filter((value) => value >= VISIBILITY_THRESHOLD)

  if (values.length === 0) return 0

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function getAnglePairs(mode: CameraTrackingMode): LandmarkPair[] {
  switch (mode) {
    case 'squat':
      return [
        [23, 25, 27],
        [24, 26, 28],
      ]
    case 'push_up':
      return [
        [11, 13, 15],
        [12, 14, 16],
      ]
    case 'curl':
      return [
        [11, 13, 15],
        [12, 14, 16],
      ]
    case 'side_bend':
      return [
        [11, 23, 25],
        [12, 24, 26],
      ]
    case 'hinge':
      return [
        [11, 23, 25],
        [12, 24, 26],
      ]
    case 'raise':
      return [
        [11, 13, 15],
        [12, 14, 16],
      ]
    case 'hold':
      return []
    default:
      return []
  }
}

function getThresholds(mode: CameraTrackingMode) {
  switch (mode) {
    case 'squat':
      return { down: 110, up: 165 }
    case 'push_up':
      return { down: 90, up: 160 }
    case 'curl':
      return { down: 70, up: 150 }
    case 'sit_up':
      return { down: 20, up: 52 }
    case 'side_bend':
      return { down: 130, up: 165 }
    case 'hinge':
      return { down: 120, up: 170 }
    case 'raise':
      return { down: 55, up: 125 }
    case 'hold':
      return { down: 100, up: 160 }
    default:
      return { down: 100, up: 160 }
  }
}

function getArmLiftValue(landmarks: PosePoint[]) {
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftWrist = landmarks[15]
  const rightWrist = landmarks[16]
  const leftHip = landmarks[23]
  const rightHip = landmarks[24]

  const shoulders = [leftShoulder, rightShoulder].filter(isVisible)
  const wrists = [leftWrist, rightWrist].filter(isVisible)
  const hips = [leftHip, rightHip].filter(isVisible)

  if (shoulders.length === 0 || wrists.length === 0) {
    return null
  }

  const shoulder = averagePoint(shoulders)
  const wrist = averagePoint(wrists)
  const hip = hips.length > 0 ? averagePoint(hips) : { x: shoulder.x, y: shoulder.y + 0.25 }
  const torsoSpan = Math.max(Math.abs(shoulder.y - hip.y), 0.1)
  const lift = (shoulder.y - wrist.y) / torsoSpan
  return Number.isFinite(lift) ? lift * 100 : null
}

function scoreMatch(key: string, patterns: RegExp[]) {
  return patterns.reduce((score, pattern) => score + (pattern.test(key) ? 1 : 0), 0)
}

function getTorsoLeanAngle(landmarks: PosePoint[]) {
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftHip = landmarks[23]
  const rightHip = landmarks[24]

  const shoulders = [leftShoulder, rightShoulder].filter(isVisible)
  const hips = [leftHip, rightHip].filter(isVisible)

  if (shoulders.length === 0 || hips.length === 0) {
    return null
  }

  const shoulder = averagePoint(shoulders)
  const hip = averagePoint(hips)

  const dx = shoulder.x - hip.x
  const dy = shoulder.y - hip.y
  const magnitude = Math.hypot(dx, dy)

  if (magnitude === 0) return null

  const angle = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI
  return Number.isFinite(angle) ? angle : null
}

function angleBetween(a?: PosePoint, b?: PosePoint, c?: PosePoint) {
  if (!a || !b || !c) return null

  const points = [a, b, c]
  if (points.some((point) => (point.visibility ?? point.presence ?? 0) < VISIBILITY_THRESHOLD)) {
    return null
  }

  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y

  const dot = abx * cbx + aby * cby
  const magA = Math.hypot(abx, aby)
  const magC = Math.hypot(cbx, cby)

  if (magA === 0 || magC === 0) return null

  const normalized = Math.max(-1, Math.min(1, dot / (magA * magC)))
  return (Math.acos(normalized) * 180) / Math.PI
}

function averagePoint(points: PosePoint[]) {
  const total = points.reduce(
    (acc, point) => {
      acc.x += point.x
      acc.y += point.y
      return acc
    },
    { x: 0, y: 0 },
  )

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  }
}

function isVisible(point?: PosePoint) {
  return (point?.visibility ?? point?.presence ?? 0) >= VISIBILITY_THRESHOLD
}

function normalizeExerciseKey(value: string) {
  return value
    .toLowerCase()
    .replace(/°|Â°|Ã‚Â°/g, ' degree ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function mirrorX(value: number, width: number) {
  return (1 - value) * width
}
