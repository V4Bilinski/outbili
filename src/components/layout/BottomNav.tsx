import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Columns3, Settings } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useEffect, useRef, useState } from 'react'

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/search', icon: Search, label: 'Busca' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Columns3, label: 'Pipeline' },
  { to: '/settings', icon: Settings, label: 'Config' },
]

export function BottomNav() {
  const location = useLocation()
  const navRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    if (!navRef.current) return
    const activeLink = navRef.current.querySelector('[data-active="true"]') as HTMLElement
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect()
      const linkRect = activeLink.getBoundingClientRect()
      setIndicator({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
      })
    }
  }, [location.pathname])

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-border">
      {/* Sliding indicator */}
      <div
        className="absolute top-0 h-[2px] bg-red rounded-b-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: indicator.left, width: indicator.width }}
      />
      <div ref={navRef} className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            data-active={isActive(item.to)}
            className={({ isActive: active }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all duration-250 min-w-[48px] min-h-[44px] justify-center',
                active
                  ? 'text-red bg-red/8'
                  : 'text-text-muted active:text-text-secondary',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      {/* Safe area spacer for notch devices */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  )
}
