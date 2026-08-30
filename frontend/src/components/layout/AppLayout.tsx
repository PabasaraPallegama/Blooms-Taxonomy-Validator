import { GraduationCap, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'New Audit', end: true },
  { to: '/results', label: 'Results' },
  { to: '/modules', label: 'Syllabi' },
  { to: '/history', label: 'History' },
  { to: '/about', label: 'About' },
]

function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark((prev) => !prev)}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

export function AppLayout() {
  return (
    <div className="bg-background min-h-svh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="text-primary size-5" />
            <span className="hidden sm:inline">Exam Fairness Auditor</span>
            <span className="sm:hidden">Auditor</span>
          </NavLink>

          <nav className="flex flex-1 items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="text-muted-foreground border-t py-6 text-center text-xs">
        Automated Pedagogical Fairness Auditing System — Bloom's Taxonomy alignment for exam papers
      </footer>
    </div>
  )
}
