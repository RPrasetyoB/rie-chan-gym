import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'

export default function OnboardingWelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex flex-col items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="animate-bounce-subtle">
          <RieChanAvatar size={128} feature="onboarding" />
        </div>
        
        <div>
          <h1 className="font-display text-3xl font-bold text-primary mb-2">
            Hi! I'm Rie-chan! ✨
          </h1>
          <p className="text-lg font-medium mb-4">
            Your Personal Fitness Coach
          </p>
          <p className="text-muted-foreground">
            I'll help you build a workout plan that's perfect for you. 
            Let's start by getting to know you better!
          </p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                <p>Tell me about yourself</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
                <p>Set your fitness goals</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
                <p>Get your personalized plan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          size="lg" 
          className="w-full"
          onClick={() => navigate('/onboarding/profile')}
        >
          Let's Get Started!
        </Button>

        <p className="text-xs text-muted-foreground">
          This will only take a few minutes
        </p>
      </div>
    </div>
  )
}
