import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Smartphone, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { getDaySegment } from '../../lib/constants'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Pesquisa' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/campaigns', icon: Smartphone, label: 'Campanhas' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
]

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const segment = getDaySegment()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-surface border-r border-stone-800/50 transition-all duration-300 fixed left-0 top-0 z-40',
        collapsed ? 'w-[72px]' : 'w-[256px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-stone-800/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red flex items-center justify-center text-white font-bold font-heading text-sm">
              O
            </div>
            <div>
              <span className="text-sm font-bold font-heading text-text-primary">OUTBILI</span>
              <p className="text-[10px] text-text-muted leading-none">V4 Bilinski &amp;Co</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-red flex items-center justify-center text-white font-bold font-heading text-sm mx-auto">
            O
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-surface-hover text-text-secondary cursor-pointer"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Segment badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-stone-800/50">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Segmento do dia</div>
          <div className="text-xs font-semibold text-red">{segment}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red/8 text-red border-l-3 border-l-red'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 border-t border-stone-800/50">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red/8 text-red'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
