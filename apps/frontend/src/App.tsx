import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import ExercisesPage from './pages/ExercisesPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'
import CalendarPage from './pages/CalendarPage'
import AICoachPage from './pages/AICoachPage'
import OnboardingWelcomePage from './pages/onboarding/OnboardingWelcomePage'
import OnboardingProfilePage from './pages/onboarding/OnboardingProfilePage'
import OnboardingGoalsPage from './pages/onboarding/OnboardingGoalsPage'
import OnboardingCompletePage from './pages/onboarding/OnboardingCompletePage'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import RequireAuth from './components/RequireAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="rie-chan-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<OnboardingWelcomePage />} />
            {/* Onboarding Routes */}
            <Route path="/onboarding/welcome" element={<OnboardingWelcomePage />} />
            <Route path="/onboarding/profile" element={<OnboardingProfilePage />} />
            <Route path="/onboarding/goals" element={<OnboardingGoalsPage />} />
            <Route path="/onboarding/complete" element={<OnboardingCompletePage />} />

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            {/* Main App Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/workout" element={<WorkoutPage />} />
                <Route path="/exercises" element={<ExercisesPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/ai-coach" element={<AICoachPage />} />
              </Route>
            </Route>

            {/* Fallback - redirect to onboarding */}
            <Route path="*" element={<OnboardingWelcomePage />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
