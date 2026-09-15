export type RieChanFeature =
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'workout'
  | 'progress'
  | 'profile'
  | 'coach'
  | 'completion'

export type RieChanPose =
  | 'idle'
  | 'happy'
  | 'cheer'
  | 'point'
  | 'rest'
  | 'celebrate'
  | 'hallo'

const DEFAULT_ASSET = '/assets/rie-chibi-cheers.png'

const FEATURE_ASSETS: Record<RieChanFeature, string> = {
  auth: '/assets/welcome.png',
  onboarding: '/assets/welcome.png',
  dashboard: '/assets/rie-chibi-cheers.png',
  workout: '/assets/rie-celebrate.png',
  progress: '/assets/rie-show-progress.png',
  profile: '/assets/profile.png',
  coach: '/assets/rie-cheers.png',
  completion: '/assets/good-job.png',
}

const POSE_ASSETS: Record<RieChanPose, string> = {
  idle: '/assets/rie-idle.png',
  happy: '/assets/rie-chibi-cheers.png',
  cheer: '/assets/rie-cheers.png',
  point: '/assets/rie-show-progress.png',
  rest: '/assets/rie-rest.png',
  celebrate: '/assets/rie-celebrate.png',
  hallo: '/assets/rie-hallo.png',
}

export function getRieChanAsset(params?: {
  feature?: RieChanFeature
  pose?: RieChanPose
}) {
  if (params?.feature) {
    return FEATURE_ASSETS[params.feature] ?? DEFAULT_ASSET
  }

  if (params?.pose) {
    return POSE_ASSETS[params.pose] ?? DEFAULT_ASSET
  }

  return DEFAULT_ASSET
}
