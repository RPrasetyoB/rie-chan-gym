export type CameraTrackingMode = 'squat' | 'push_up' | 'curl' | 'sit_up' | 'side_bend'

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
}

const MODE_HINTS: Record<CameraTrackingMode, string> = {
  squat: 'Stand tall, sink down, then come back to standing to count one rep.',
  push_up: 'Lower your chest, then press back to the top.',
  curl: 'Let the elbows bend fully, then return the arms to the top position.',
  sit_up: 'Curl your torso up, then lower with control.',
  side_bend: 'Lean to the side, then return upright to finish one rep.',
}

export function createRepTrackerState(): RepTrackerState {
  return {
    phase: 'up',
    reps: 0,
  }
}

export function getCameraTrackingMode(exerciseId?: string, exerciseName?: string): CameraTrackingMode | null {
  const key = normalizeExerciseKey(`${exerciseId ?? ''} ${exerciseName ?? ''}`)

  if (/\b(squat|split squat|lunge|step up)\b/.test(key)) return 'squat'
  if (/\b(push up|pushup|burpee)\b/.test(key)) return 'push_up'
  if (/\b(curl|bicep|biceps|preacher curl|drag curl|concentration curl)\b/.test(key)) return 'curl'
  if (/\b(sit up|situp|crunch|knee raise|leg raise|v up|v-up)\b/.test(key)) return 'sit_up'
  if (/\b(side bend|side crunch|oblique|twist)\b/.test(key)) return 'side_bend'

  return null
}

export function getCameraModeLabel(mode: CameraTrackingMode | null) {
  return mode ? MODE_LABELS[mode] : 'movement'
}

export function getCameraModeHint(mode: CameraTrackingMode | null) {
  return mode ? MODE_HINTS[mode] : 'Camera rep counting is only tuned for a few movements right now.'
}

export function measurePoseValue(mode: CameraTrackingMode, landmarks: PosePoint[]) {
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
    default:
      return { down: 100, up: 160 }
  }
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
