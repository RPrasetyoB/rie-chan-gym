import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Dumbbell, BookOpen, TrendingUp, User, Calendar, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workout', label: 'Workout', icon: Dumbbell },
  { path: '/exercises', label: 'Exercises', icon: BookOpen },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-full min-w-[44px] transition-all',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-6 w-6', isActive && 'scale-110')} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Floating Action Button for Quick Actions */}
      <button
        onClick={() => navigate('/calendar')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 z-40"
        aria-label="Calendar"
      >
        <Calendar className="h-6 w-6" />
      </button>

      {/* AI Coach FAB */}
      <button
        onClick={() => navigate('/ai-coach')}
        className="fixed bottom-24 left-4 w-14 h-14 bg-primary/85 text-primary-foreground rounded-full shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary transition-all active:scale-95 z-40"
        aria-label="AI Coach"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  )
}
