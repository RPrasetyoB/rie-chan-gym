import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { apiDelete, apiGet, apiPatch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type AdminUser = {
  id: string; name: string; email: string; role: string; createdAt: string
  profile: { experienceLevel: string; goalWeight: number | null } | null
  _count: { workoutSessions: number; progress: number }
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [deleteAllData, setDeleteAllData] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiGet<{ users: AdminUser[] }>('/admin/users').then((data) => setUsers(data.users)).catch((error) => {
      if (error instanceof Error && 'status' in error && (error as Error & { status?: number }).status === 403) {
        navigate('/not-found', { replace: true })
        return
      }
      toast({ title: 'Could not load admin data', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    })
  }, [navigate, toast])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (roleFilter === 'all' || user.role === roleFilter)
  }), [users, query, roleFilter])

  const changeRole = async (user: AdminUser, role: string) => {
    try {
      await apiPatch(`/admin/users/${user.id}/role`, { role })
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role } : item))
      toast({ title: 'Role updated', description: `${user.name} is now a ${role}.` })
    } catch (error) { toast({ title: 'Could not update role', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' }) }
  }

  const deleteUser = async () => {
    if (!selected) return
    setBusy(true)
    try {
      await apiDelete(`/admin/users/${selected.id}`, { deleteAllData })
      setUsers((current) => current.filter((user) => user.id !== selected.id))
      toast({ title: 'User deleted', description: deleteAllData ? 'Their account and all workout data were removed.' : 'Their account was removed.' })
      setSelected(null)
    } catch (error) { toast({ title: 'Could not delete user', description: error instanceof Error ? error.message : 'Try again.', variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  const stats = { total: users.length, clients: users.filter((user) => user.role !== 'admin').length, active: users.filter((user) => user._count.workoutSessions > 0).length }
  const statCards = [{ label: 'Total users', value: stats.total, icon: Users }, { label: 'Clients', value: stats.clients, icon: Check }, { label: 'Have workout history', value: stats.active, icon: ShieldCheck }]

  return <div className="min-h-[100dvh] bg-background">
    <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-secondary" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><div><p className="font-display text-lg font-bold">Rie-chan <span className="text-primary">/ Admin</span></p><p className="text-xs text-muted-foreground">Operations console</p></div></div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Admin mode</div>
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-8"><p className="text-primary text-sm font-semibold tracking-wide uppercase">People & permissions</p><h1 className="font-display text-3xl md:text-4xl font-bold mt-1">User management</h1><p className="text-muted-foreground mt-2">Keep your community healthy, helpful, and on track.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon }) => <Card key={label} className="p-5"><div className="flex justify-between items-start"><div><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-3xl font-bold mt-2">{value}</p></div><div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div></div></Card>)}
      </div>
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col md:flex-row gap-3 md:items-center md:justify-between"><div><h2 className="font-display text-xl font-bold">All users</h2><p className="text-sm text-muted-foreground mt-1">{filteredUsers.length} visible accounts</p></div><div className="flex gap-2"><div className="relative flex-1 md:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="pl-9 h-10" /></div><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-lg border-2 border-input bg-background px-3 text-sm"><option value="all">All roles</option><option value="user">User</option><option value="client">Client</option><option value="admin">Admin</option></select></div></div>
        <div className="divide-y divide-border">{filteredUsers.map((user) => <div key={user.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex items-center gap-3 flex-1 min-w-0"><div className="h-11 w-11 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display font-bold">{user.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="font-semibold truncate">{user.name}</p><p className="text-sm text-muted-foreground truncate">{user.email}</p></div></div><div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm min-w-[210px]"><span className="text-muted-foreground">Workouts <b className="text-foreground ml-1">{user._count.workoutSessions}</b></span><span className="text-muted-foreground">Progress <b className="text-foreground ml-1">{user._count.progress}</b></span><span className="text-muted-foreground">Joined <b className="text-foreground ml-1">{new Date(user.createdAt).toLocaleDateString()}</b></span><span className="text-muted-foreground capitalize">Level <b className="text-foreground ml-1">{user.profile?.experienceLevel ?? '—'}</b></span></div><div className="flex items-center gap-2"><div className="relative"><select value={user.role} onChange={(event) => changeRole(user, event.target.value)} className="appearance-none h-10 rounded-lg border border-border bg-secondary pl-3 pr-8 text-sm capitalize"><option value="user">User</option><option value="client">Client</option><option value="admin">Admin</option></select><ChevronDown className="pointer-events-none absolute right-2 top-3 h-4 w-4 text-muted-foreground" /></div><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setSelected(user)} aria-label={`Delete ${user.name}`}><Trash2 className="h-4 w-4" /></Button></div></div>)}{filteredUsers.length === 0 && <div className="p-12 text-center text-muted-foreground">No users match this search.</div>}</div>
      </Card>
    </main>
    {selected && <div className="fixed inset-0 z-50 bg-black/60 p-4 grid place-items-center" role="presentation"><div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6" role="dialog" aria-modal="true" aria-labelledby="delete-title"><div className="flex justify-between items-start"><div className="h-11 w-11 rounded-full bg-destructive/10 text-destructive grid place-items-center"><Trash2 className="h-5 w-5" /></div><button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-secondary" aria-label="Close"><X className="h-5 w-5" /></button></div><h2 id="delete-title" className="font-display text-xl font-bold mt-4">Delete {selected.name}?</h2><p className="text-sm text-muted-foreground mt-2">This action cannot be undone. Choose whether to remove their fitness history too.</p><label className="mt-5 flex gap-3 p-3 rounded-xl border border-border cursor-pointer"><input type="checkbox" checked={deleteAllData} onChange={(event) => setDeleteAllData(event.target.checked)} className="mt-1 accent-primary" /><span><span className="font-medium block">Delete all user data</span><span className="text-xs text-muted-foreground">Profile, workouts, progress, meals, and tokens</span></span></label><div className="flex gap-3 mt-6"><Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Cancel</Button><Button variant="destructive" className="flex-1" onClick={deleteUser} disabled={busy}>{busy ? 'Deleting…' : 'Delete user'}</Button></div></div></div>}
  </div>
}
