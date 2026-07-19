import { Outlet } from 'react-router-dom'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'

export default function AuthLayout() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4 animate-bounce-subtle">
            <RieChanAvatar size={96} feature="auth" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mb-2">
            Rie-chan Cute PT
          </h1>
          <p className="text-muted-foreground text-sm">
            Your personal fitness coach ✨
          </p>
        </div>
        <Outlet />
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Free for personal use</p>
          <p className="mt-1">
            Not medical advice — consult a doctor before starting any exercise program
          </p>
        </div>
      </div>
    </div>
  )
}
