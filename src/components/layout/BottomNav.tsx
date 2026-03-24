import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Smartphone, Settings } from 'lucide-react'
import { cn } from '../../lib/cn'

const items = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/search', icon: Search, label: 'Busca' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/campaigns', icon: Smartphone, label: 'Camp.' },
  { to: '/settings', icon: Settings, label: 'Config' },
]

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all min-w-[48px] min-h-[44px] justify-center',
                isActive
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
