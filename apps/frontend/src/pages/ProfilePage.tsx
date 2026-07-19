import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Moon, Sun, Bell, Shield, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { calculateAgeFromBirthday, clearOnboardingState, loadOnboardingState } from '@/lib/onboardingStorage'
import { clearAuthSession, loadAuthSession } from '@/lib/appState'
import { apiPost, clearAuthTokens } from '@/lib/api'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const onboardingState = loadOnboardingState()
  const authSession = loadAuthSession()
  const profile = onboardingState.profile
  const age = profile?.birthday ? calculateAgeFromBirthday(profile.birthday) : null

  const handleLogout = async () => {
    await apiPost('/auth/logout', {}, true).catch(() => undefined)
    clearAuthSession()
    clearAuthTokens()
    navigate('/login')
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Delete your local profile data and onboarding progress? This cannot be undone.',
    )

    if (!confirmed) return

    clearAuthSession()
    clearAuthTokens()
    clearOnboardingState()
    navigate('/onboarding/welcome')
  }

  const handleExportData = () => {
    const payload = {
      profile,
      age,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rie-chan-profile-export.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold mb-4">Profile</h1>

      {/* User Info Card */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <RieChanAvatar size={64} feature="profile" />
            <div>
              <h2 className="font-display text-xl font-bold">
                {profile?.name || authSession?.name || 'Your Profile'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile?.equipment || authSession?.email || 'Workout setup not saved yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {age ? `Age ${age}` : 'Member since Jan 2024'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-2xl font-bold text-primary">42</p>
              <p className="text-xs text-muted-foreground">Workouts</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-primary">7</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-primary">125k</p>
              <p className="text-xs text-muted-foreground">kg Lifted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Privacy & Security
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/onboarding/welcome')}>
            Edit Profile
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
            Export Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>

      {/* Medical Disclaimer */}
      <div className="mt-6 p-4 bg-secondary/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Medical Disclaimer</p>
        <p>
          Not medical advice — consult a doctor or physical therapist before starting any new exercise program, especially with existing injuries or health conditions.
        </p>
      </div>
    </div>
  )
}
