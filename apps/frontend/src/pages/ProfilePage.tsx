import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Moon, Sun, Bell, Shield, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { calculateAgeFromBirthday, clearOnboardingState, loadOnboardingState, normalizeEquipmentSelection } from '@/lib/onboardingStorage'
import { clearAuthSession, loadAuthSession } from '@/lib/appState'
import { apiDelete, apiPost, clearAuthTokens } from '@/lib/api'

function formatEquipmentLabel(value: string) {
  return value
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAccess\b/, 'Access')
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const onboardingState = loadOnboardingState()
  const authSession = loadAuthSession()
  const profile = onboardingState.profile
  const age = profile?.birthday ? calculateAgeFromBirthday(profile.birthday) : null
  const [panel, setPanel] = useState<'privacy' | 'notifications' | null>(null)
  const [notifyWorkout, setNotifyWorkout] = useState(() => localStorage.getItem('rie-chan-notify-workout') !== 'false')
  const [notifyCoach, setNotifyCoach] = useState(() => localStorage.getItem('rie-chan-notify-coach') !== 'false')

  const handleLogout = async () => {
    await apiPost('/auth/logout', {}, true).catch(() => undefined)
    clearAuthSession()
    clearAuthTokens()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    const deleteAllData = window.confirm('Delete your account and ALL workout, progress, and profile data? Select Cancel to keep your fitness history.')
    const confirmed = deleteAllData || window.confirm('Delete your account while keeping your fitness history where possible? This cannot be undone.')

    if (!confirmed) return

    await apiDelete('/auth/account', { deleteAllData }).catch(() => undefined)
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
                {normalizeEquipmentSelection(profile?.equipment).map(formatEquipmentLabel).join(', ') ||
                  authSession?.email ||
                  'Workout setup not saved yet'}
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
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/notifications')}>
            <Bell className="h-4 w-4 mr-2" />
            Notifications <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">2</span>
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/privacy')}>
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
          {authSession?.role === 'admin' && (
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin')}>
              <Shield className="h-4 w-4 mr-2" />
              Open Admin Console
            </Button>
          )}
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

      {panel && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 grid place-items-center" role="presentation" onClick={() => setPanel(null)}>
          <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-6" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-primary text-xs font-semibold uppercase tracking-wide">Rie-chan settings</p>
                <h2 className="font-display text-2xl font-bold mt-1">{panel === 'privacy' ? 'Privacy & Security' : 'Notifications'}</h2>
              </div>
              <button onClick={() => setPanel(null)} className="text-muted-foreground hover:text-foreground text-2xl leading-none" aria-label="Close">×</button>
            </div>

            {panel === 'notifications' ? (
              <div className="mt-6 space-y-5">
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-xl bg-primary/10 p-3"><div className="h-8 w-8 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center"><Bell className="h-4 w-4" /></div><div><p className="font-medium text-sm">Your weekly check-in is ready</p><p className="text-xs text-muted-foreground mt-1">Review your progress and keep your streak going.</p></div></div>
                  <div className="flex gap-3 rounded-xl bg-secondary p-3"><div className="h-8 w-8 shrink-0 rounded-full bg-background text-primary grid place-items-center"><Shield className="h-4 w-4" /></div><div><p className="font-medium text-sm">Small steps count</p><p className="text-xs text-muted-foreground mt-1">Rie-chan is cheering you on for your next workout.</p></div></div>
                </div>
                <div className="border-t border-border pt-5 space-y-4"><p className="font-display font-semibold">Notification preferences</p><label className="flex items-center justify-between gap-4 text-sm"><span><span className="font-medium block">Workout reminders</span><span className="text-xs text-muted-foreground">Get a nudge when it’s time to train.</span></span><input type="checkbox" checked={notifyWorkout} onChange={(event) => { setNotifyWorkout(event.target.checked); localStorage.setItem('rie-chan-notify-workout', String(event.target.checked)) }} className="h-5 w-5 accent-primary" /></label><label className="flex items-center justify-between gap-4 text-sm"><span><span className="font-medium block">Coach encouragement</span><span className="text-xs text-muted-foreground">Receive helpful tips from Rie-chan.</span></span><input type="checkbox" checked={notifyCoach} onChange={(event) => { setNotifyCoach(event.target.checked); localStorage.setItem('rie-chan-notify-coach', String(event.target.checked)) }} className="h-5 w-5 accent-primary" /></label></div>
              </div>
            ) : (
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-xl border border-border p-4"><p className="font-display font-semibold">Your data belongs to you</p><p className="text-muted-foreground mt-1">Rie-chan uses your profile and workout information to personalize plans, progress tracking, and coaching.</p></div>
                <div className="space-y-2"><Button variant="outline" className="w-full justify-start" onClick={handleExportData}>Download my data</Button><Button variant="outline" className="w-full justify-start" onClick={() => window.alert('Privacy policy: We only use your fitness data to provide and improve your Rie-chan experience. We never sell personal data.')}>Read privacy policy</Button><Button variant="outline" className="w-full justify-start" onClick={() => window.alert('Security: Your session is protected with access and refresh tokens. Sign out on shared devices and never share your password.')}>Security information</Button></div>
                <p className="text-xs text-muted-foreground">You can permanently remove your account from the Account section below. This action cannot be undone.</p>
              </div>
            )}
            <Button variant="secondary" className="w-full mt-6" onClick={() => setPanel(null)}>Done</Button>
          </div>
        </div>
      )}
    </div>
  )
}
