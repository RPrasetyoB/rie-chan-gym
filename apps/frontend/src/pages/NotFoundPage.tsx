import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <main className="min-h-[100dvh] grid place-items-center bg-background px-6 text-center">
    <div><p className="font-display text-7xl font-bold text-primary">404</p><h1 className="font-display text-2xl font-bold mt-3">Page not found</h1><p className="text-muted-foreground mt-2">The page you’re looking for doesn’t exist.</p><Link to="/" className="inline-flex items-center justify-center mt-6 h-12 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Back to home</Link></div>
  </main>
}
