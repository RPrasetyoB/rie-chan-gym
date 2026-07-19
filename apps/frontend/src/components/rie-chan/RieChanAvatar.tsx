import React from 'react'
import { getRieChanAsset, type RieChanFeature, type RieChanPose } from '@/lib/rieChanAssets'

interface RieChanAvatarProps {
  size?: number
  className?: string
  expression?: 'idle' | 'happy' | 'cheer' | 'point' | 'rest' | 'celebrate'
  pose?: RieChanPose
  feature?: RieChanFeature
}

export const RieChanAvatar: React.FC<RieChanAvatarProps> = ({
  size = 64,
  className = '',
  expression = 'idle',
  pose,
  feature,
}) => {
  const selectedPose = pose ?? expression
  const src = getRieChanAsset({ feature, pose: selectedPose })

  return (
    <img
      src={src}
      alt="Rie-chan mascot"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      loading="lazy"
      decoding="async"
    />
  )
}
