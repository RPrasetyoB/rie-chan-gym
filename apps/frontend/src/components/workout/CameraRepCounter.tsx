import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Camera, CameraOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  advanceRepTracker,
  createRepTrackerState,
  drawPoseOverlay,
  getCameraModeHint,
  getCameraModeLabel,
  getCameraTrackingMode,
  type CameraTrackingMode,
  type PoseLandmark,
} from '@/lib/poseCounter'
import type { MoveNetModelConfig } from '@tensorflow-models/pose-detection/dist/movenet/types'
import type { PoseDetector } from '@tensorflow-models/pose-detection/dist/pose_detector'
import type { Pose } from '@tensorflow-models/pose-detection/dist/types'

type CameraStage = 'idle' | 'loading' | 'tracking'
let poseDetectorPromise: Promise<PoseDetector> | null = null

async function loadPoseDetector() {
  if (!poseDetectorPromise) {
    poseDetectorPromise = (async () => {
      const tf = await import('@tensorflow/tfjs-core')
      const trySetBackend = async (backend: 'webgl' | 'cpu') => {
        if (backend === 'webgl') {
          await import('@tensorflow/tfjs-backend-webgl')
        } else {
          await import('@tensorflow/tfjs-backend-cpu')
        }

        await tf.setBackend(backend)
        await tf.ready()
      }

      await import('@tensorflow/tfjs-backend-webgl')
      const { load: loadMoveNetDetector } = await import('@tensorflow-models/pose-detection/dist/movenet/detector')

      try {
        await trySetBackend('webgl')
      } catch {
        await trySetBackend('cpu')
      }

      const config: MoveNetModelConfig = {
        modelType: 'SinglePose.Lightning',
        enableSmoothing: true,
      }

      return loadMoveNetDetector(config)
    })()
  }

  try {
    return await poseDetectorPromise
  } catch (error) {
    poseDetectorPromise = null
    throw error
  }
}

interface CameraRepCounterProps {
  exerciseId?: string
  exerciseName?: string
  isWorkoutActive: boolean
  isTrackingEnabled?: boolean
  showControls?: boolean
  className?: string
  onRepCountChange: (value: number) => void
  onCameraActiveChange: (value: boolean) => void
}

export function CameraRepCounter({
  exerciseId,
  exerciseName,
  isWorkoutActive,
  isTrackingEnabled = true,
  showControls = true,
  className,
  onRepCountChange,
  onCameraActiveChange,
}: CameraRepCounterProps) {
  const mode = useMemo(() => getCameraTrackingMode(exerciseId, exerciseName), [exerciseId, exerciseName])

  const [isStarting, setIsStarting] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [holdSeconds, setHoldSeconds] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [stage, setStage] = useState<CameraStage>('idle')
  const [poseDetected, setPoseDetected] = useState(false)
  const [modelLabel, setModelLabel] = useState('not loaded')
  const [status, setStatus] = useState(mode ? `Ready for ${getCameraModeLabel(mode)} reps.` : getCameraModeHint(mode))
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const modelRef = useRef<PoseDetector | null>(null)
  const rafRef = useRef<number | null>(null)
  const processingRef = useRef(false)
  const trackerRef = useRef(createRepTrackerState())
  const repCountRef = useRef(0)
  const modeRef = useRef<CameraTrackingMode | null>(mode)
  const repCountChangeRef = useRef(onRepCountChange)
  const isActiveRef = useRef(isActive)
  const stageRef = useRef<CameraStage>('idle')
  const autoResumeRef = useRef(true)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    repCountChangeRef.current = onRepCountChange
  }, [onRepCountChange])

  useEffect(() => {
    isActiveRef.current = isActive
    onCameraActiveChange(isActive)
  }, [isActive, onCameraActiveChange])

  useEffect(() => {
    stageRef.current = stage
  }, [stage])

  useEffect(() => {
    trackerRef.current = createRepTrackerState()
    repCountRef.current = 0
    setRepCount(0)
    setHoldSeconds(0)

    if (isActiveRef.current) {
      repCountChangeRef.current(0)
    }

    setConfidence(0)

    if (!mode) {
      setStatus(getCameraModeHint(mode))
      if (isActive) {
        void stopCamera()
      }
      return
    }

    setStatus(
      isActive
        ? mode === 'hold'
          ? `Hold steady for your ${getCameraModeLabel(mode)} work.`
          : `Tracking ${getCameraModeLabel(mode)} reps now.`
        : mode === 'hold'
          ? `Ready for your ${getCameraModeLabel(mode)} hold.`
          : `Ready for ${getCameraModeLabel(mode)} reps.`,
    )
  }, [exerciseId, exerciseName, mode])

  useEffect(() => {
    if (!mode) return
    setStatus(
      isActive
        ? mode === 'hold'
          ? `Hold steady for your ${getCameraModeLabel(mode)} work.`
          : `Tracking ${getCameraModeLabel(mode)} reps now.`
        : mode === 'hold'
          ? `Ready for your ${getCameraModeLabel(mode)} hold.`
          : `Ready for ${getCameraModeLabel(mode)} reps.`,
    )
  }, [isActive, mode])

  useEffect(() => {
    return () => {
      void stopCamera({ preserveAutoResume: true })
    }
  }, [])

  useEffect(() => {
    if (!isWorkoutActive) {
      autoResumeRef.current = false
      return
    }

    if (mode && autoResumeRef.current && !isActive && !isStarting && !streamRef.current) {
      void startCamera()
    }
  }, [isWorkoutActive, mode, isActive, isStarting])

  useEffect(() => {
    if (!isActive || mode !== 'hold') return

    const timer = window.setInterval(() => {
      setHoldSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isActive, mode])

  async function startCamera() {
    if (!isWorkoutActive || isStarting || isActive) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser.')
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      const video = videoRef.current
      if (!video) throw new Error('Camera preview is not ready yet.')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
        },
      })

      streamRef.current = stream
      video.srcObject = stream
      void video.play().catch(() => undefined)

      trackerRef.current = createRepTrackerState()
      repCountRef.current = 0
      repCountChangeRef.current(0)
      setRepCount(0)
      setHoldSeconds(0)
      setConfidence(0)
      setPoseDetected(false)
      setModelLabel('loading')
      setStage('loading')
      setIsActive(true)

      if (mode === 'hold') {
        setModelLabel('Timer mode')
        setStage('tracking')
        setStatus('Hold steady. Breathe smoothly and keep your position locked in.')
        return
      }

      setStatus('Loading browser pose detector...')
      const model = await loadPoseDetector()
      modelRef.current = model
      setModelLabel('MoveNet Lightning')
      setStage('tracking')
      setStatus(
        mode
          ? `Tracking ${getCameraModeLabel(mode)} reps now with browser pose detection.`
          : 'Camera preview is active. Rep counting is only available for supported movements.',
      )

      loop()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Could not start the camera.'
      setError(message)
      setStatus(mode === 'hold' ? 'Timer mode is unavailable right now.' : 'Camera counting is unavailable right now.')
      await stopCamera()
    } finally {
      setIsStarting(false)
    }
  }

  async function stopCamera(options?: { preserveAutoResume?: boolean }) {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    processingRef.current = false

    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }

    const video = videoRef.current
    if (video) {
      if (!video.paused) {
        video.pause()
      }
      video.srcObject = null
    }

    if (isActiveRef.current) {
      setIsActive(false)
    }

    if (!options?.preserveAutoResume) {
      autoResumeRef.current = false
    }

    setStage('idle')
    stageRef.current = 'idle'
    setPoseDetected(false)
    setConfidence(0)
    setHoldSeconds(0)
  }

  function resetCounter() {
    trackerRef.current = createRepTrackerState()
    repCountRef.current = 0
    repCountChangeRef.current(0)
    setRepCount(0)
    setConfidence(0)
    setHoldSeconds(0)
    setStatus(
      mode
        ? mode === 'hold'
          ? `Timer reset. Hold ready for ${getCameraModeLabel(mode)} work.`
          : `Counter reset for ${getCameraModeLabel(mode)} reps.`
        : getCameraModeHint(mode),
    )
  }

  async function loop() {
    if (!isActiveRef.current) return

    if (modeRef.current === 'hold') {
      return
    }

    const video = videoRef.current
    const model = modelRef.current

    if (!video || !model) {
      rafRef.current = window.requestAnimationFrame(() => {
        void loop()
      })
      return
    }

    if (!processingRef.current && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      processingRef.current = true
      try {
        const results = await model.estimatePoses(video, {
          flipHorizontal: true,
        })
        handleResults(results[0], video.videoWidth, video.videoHeight)
      } catch {
        setConfidence(0)
      } finally {
        processingRef.current = false
      }
    }

    rafRef.current = window.requestAnimationFrame(() => {
      void loop()
    })
  }

  function handleResults(pose: Pose | undefined, width = 0, height = 0) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const landmarks = convertPoseToLandmarks(pose, width, height)
    const detected = hasTrackedKeypoints(landmarks)

    setPoseDetected(detected)
    setConfidence(getPoseConfidence(landmarks))

    if (canvas && ctx) {
      const drawWidth = Math.max(width || canvas.width, 1)
      const drawHeight = Math.max(height || canvas.height, 1)
      canvas.width = drawWidth
      canvas.height = drawHeight
      drawPoseOverlay(ctx, landmarks, drawWidth, drawHeight)
    }

    if (!detected) {
      if (stageRef.current === 'tracking') {
        setStatus(
          modeRef.current
            ? 'No body detected. Move into view and keep your working joints visible.'
            : 'Camera preview is active. Move into view to see your outline.',
        )
      }
      return
    }

    if (stageRef.current === 'tracking') {
      setStatus(
        modeRef.current
          ? isTrackingEnabled
            ? `Body detected. Tracking ${getCameraModeLabel(modeRef.current)} reps now.`
            : 'Body detected. Rest mode paused rep counting.'
          : 'Camera preview is active. Rep counting is not enabled for this movement.',
      )
    }

    if (!isTrackingEnabled || !modeRef.current || modeRef.current === 'hold') {
      return
    }

    if (stageRef.current === 'tracking' && modeRef.current) {
      const next = advanceRepTracker(modeRef.current, landmarks, trackerRef.current)
      trackerRef.current = next.state

      if (next.state.reps !== repCountRef.current) {
        repCountRef.current = next.state.reps
        setRepCount(next.state.reps)
        repCountChangeRef.current(next.state.reps)
        setStatus(`${getCameraModeLabel(modeRef.current)} count: ${next.state.reps} rep${next.state.reps === 1 ? '' : 's'}.`)
      }
    }
  }

  function convertPoseToLandmarks(pose: Pose | undefined, width: number, height: number) {
    const landmarks: PoseLandmark[] = Array.from({ length: 29 }, () => ({
      x: 0,
      y: 0,
      visibility: 0,
    }))

    if (!pose?.keypoints?.length || width <= 0 || height <= 0) {
      return landmarks
    }

    const assign = (targetIndex: number, keypointName: string) => {
      const point = pose.keypoints.find((keypoint) => keypoint.name === keypointName)
      if (!point) return

      landmarks[targetIndex] = {
        x: clamp01(point.x / width),
        y: clamp01(point.y / height),
        visibility: point.score ?? 0,
      }
    }

    assign(0, 'nose')
    assign(11, 'left_shoulder')
    assign(12, 'right_shoulder')
    assign(13, 'left_elbow')
    assign(14, 'right_elbow')
    assign(15, 'left_wrist')
    assign(16, 'right_wrist')
    assign(23, 'left_hip')
    assign(24, 'right_hip')
    assign(25, 'left_knee')
    assign(26, 'right_knee')
    assign(27, 'left_ankle')
    assign(28, 'right_ankle')

    return landmarks
  }

  function hasTrackedKeypoints(landmarks: PoseLandmark[]) {
    const trackedIndexes = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    return trackedIndexes.some((index) => (landmarks[index]?.visibility ?? 0) > 0.2)
  }

  function getPoseConfidence(landmarks: PoseLandmark[]) {
    const trackedIndexes = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
    const values = trackedIndexes
      .map((index) => landmarks[index]?.visibility ?? landmarks[index]?.presence ?? 0)
      .filter((value) => value > 0)

    if (values.length === 0) return 0
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100)
  }

  const buttonLabel = isActive ? 'Stop camera' : isStarting ? 'Starting camera...' : 'Start camera rep counter'
  const isButtonDisabled = !isWorkoutActive || isStarting
  const displayValue = mode === 'hold' ? holdSeconds : repCount
  const timingLabel = mode === 'hold' ? 'Hold timer' : 'Camera rep counter'
  const stateLabel = mode === 'hold' ? (isActive ? 'Hold live' : 'Hold off') : isActive ? 'Camera live' : 'Camera off'
  const signalLabel = mode === 'hold' ? 'Breath and form' : `${confidence}%`
  const bodyLabel = mode === 'hold' ? (poseDetected ? 'Position set' : 'Finding position') : poseDetected ? 'Detected' : 'Searching'
  const statusCopy =
    mode === 'hold'
      ? isActive
        ? 'Hold strong, keep breathing, and stay steady.'
        : 'This movement uses the timer. Press start when you are ready.'
      : status

  return (
    <div className={className ?? 'rounded-xl bg-card shadow-sm'}>
      <div className={`relative overflow-hidden ${showControls ? 'mt-4 rounded-lg' : 'h-full rounded-2xl'}`}>
        <video
          ref={videoRef}
          className={`w-full object-cover scale-x-[-1] ${showControls ? 'aspect-video' : 'h-full min-h-[320px]'}`}
          muted
          playsInline
          autoPlay
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
      {showControls && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-evenly gap-3 mt-2">
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => void (isActive ? stopCamera() : startCamera())} disabled={isButtonDisabled}>
                {isActive ? <CameraOff className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                {buttonLabel}
              </Button>
              <Button variant="outline" size="sm" onClick={resetCounter} disabled={!isActive}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            <div className="flex gap-4 items-center">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                {timingLabel}
              </p>
              <p className="font-display text-3xl font-bold text-primary">
                {mode === 'hold' ? `${String(Math.floor(displayValue / 60)).padStart(1, '0')}:${String(displayValue % 60).padStart(2, '0')}` : displayValue}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 px-2">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">State</p>
              <p className="font-medium">{stateLabel}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="font-medium">{signalLabel}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 px-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="font-medium">{modelLabel}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Body</p>
              <p className="font-medium">{bodyLabel}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground px-2">{statusCopy}</p>
          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}
