import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Smartphone, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getDaySegment } from '../../lib/constants'
import { useSidebar } from '../../lib/sidebar-context'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Pesquisa' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/campaigns', icon: Smartphone, label: 'Campanhas' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
]

export function Sidebar() {
  const { collapsed, toggle } = useSidebar()
  const segment = getDaySegment()

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out',
          'bg-surface/80 backdrop-blur-xl border-r border-border',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-border transition-all duration-300',
          collapsed ? 'justify-center px-3 py-5' : 'px-5 py-5',
        )}>
          {collapsed ? (
            <img
              src="/outbili/v4-icon.png"
              alt="V4"
              className="h-9 w-9 object-contain transition-all duration-300"
            />
          ) : (
            <img
              src="/outbili/logo-white.png"
              alt="V4 Bilinski&Co"
              className="h-12 w-auto object-contain transition-all duration-300"
            />
          )}
        </div>

        {/* Segment of the day */}
        {!collapsed && (
          <div className="px-5 py-4 border-b border-border animate-[fade-in_0.2s_ease-out]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium">Segmento do dia</span>
            </div>
            <p className="text-sm font-semibold text-red mt-1 font-heading">{segment}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-[0.15em] text-text-muted font-medium px-3 mb-3 animate-[fade-in_0.2s_ease-out]">Menu</p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? item.label : undefined}
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
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-3 px-3 border-t border-border">
          <NavLink
            to="/settings"
            title={collapsed ? 'Configurações' : undefined}
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
        </div>
      </aside>

      {/* Collapse toggle — floating button on the edge between sidebar and content */}
      <button
        onClick={toggle}
        className={cn(
          'hidden md:flex items-center justify-center',
          'fixed top-1/2 -translate-y-1/2 z-50',
          'w-6 h-12 rounded-r-lg',
          'bg-surface-md border border-l-0 border-border',
          'text-text-muted hover:text-text-primary hover:bg-surface-hover',
          'transition-all duration-300 ease-in-out cursor-pointer',
          'hover:w-7 hover:shadow-lg hover:shadow-black/30',
          'group',
          collapsed ? 'left-[72px]' : 'left-[260px]',
        )}
        title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        )}
      </button>
    </>
  )
}
