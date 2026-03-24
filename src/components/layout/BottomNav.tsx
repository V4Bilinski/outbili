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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-stone-800/50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 text-[10px] font-medium transition-colors min-w-[44px] min-h-[44px] justify-center',
                isActive ? 'text-red' : 'text-text-secondary',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
