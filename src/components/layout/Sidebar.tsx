import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Smartphone, BarChart3, Settings, PanelLeftClose, PanelLeft } from 'lucide-react'
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const segment = getDaySegment()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300',
        'bg-surface/80 backdrop-blur-xl border-r border-border',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-[72px] border-b border-border', collapsed ? 'justify-center px-3' : 'px-5')}>
        {collapsed ? (
          <img src="/outbili/logo-white.png" alt="V4 Bilinski" className="h-7 w-auto object-contain" />
        ) : (
          <img src="/outbili/logo-white.png" alt="V4 Bilinski&Co" className="h-8 w-auto object-contain" />
        )}
      </div>

      {/* Segment of the day */}
      {!collapsed && (
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">Segmento do dia</span>
          </div>
          <p className="text-sm font-semibold text-red mt-1 font-heading">{segment}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium px-3 mb-3">Menu</p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-red/10 text-red shadow-[inset_0_0_0_1px_rgba(230,51,41,0.15)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-3 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-red/10 text-red'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]',
              collapsed && 'justify-center px-2',
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full',
            'text-text-muted hover:text-text-secondary hover:bg-white/[0.03] cursor-pointer',
            collapsed && 'justify-center px-2',
          )}
        >
          {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  )
}
