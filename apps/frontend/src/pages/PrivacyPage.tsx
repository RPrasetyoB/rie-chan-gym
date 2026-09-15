import { ArrowLeft, Download, LockKeyhole, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { loadOnboardingState, calculateAgeFromBirthday } from '@/lib/onboardingStorage'

export default function PrivacyPage() {
  const navigate = useNavigate()
  const profile = loadOnboardingState().profile

  const downloadData = () => {
    const payload = { profile, age: profile?.birthday ? calculateAgeFromBirthday(profile.birthday) : null, exportedAt: new Date().toISOString() }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'rie-chan-data-export.json'; link.click(); URL.revokeObjectURL(url)
  }

  return <div className="p-4 max-w-lg mx-auto"><button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5"><ArrowLeft className="h-4 w-4" /> Back to profile</button><h1 className="font-display text-3xl font-bold">Privacy & Security</h1><p className="text-muted-foreground mt-2 mb-6">Understand how Rie-chan protects and uses your information.</p><Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Your data, your control</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground space-y-3"><p>We use your profile, workout history, and progress data to personalize your training experience and coaching.</p><p>We do not sell your personal information. You can export or remove your data at any time.</p></CardContent></Card><Card className="mb-4"><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-primary" /> Security</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground space-y-3"><p>Your account uses protected sessions and encrypted password storage. Never share your password or leave your account open on a shared device.</p><p>Sign out from Profile when using a public or shared computer.</p></CardContent></Card><Card><CardContent className="p-5"><Button variant="outline" className="w-full justify-start" onClick={downloadData}><Download className="h-4 w-4 mr-2" /> Download my data</Button><p className="text-xs text-muted-foreground mt-4">Privacy policy last updated September 2026.</p></CardContent></Card></div>
}
