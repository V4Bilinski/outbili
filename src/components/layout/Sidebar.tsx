import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Columns3, Smartphone, BarChart3, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSidebar } from '../../lib/sidebar-context'
import { useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Pesquisa' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Columns3, label: 'Pipeline' },
  { to: '/campaigns', icon: Smartphone, label: 'Campanhas' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
]

function SidebarContent({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-border transition-all duration-300',
        collapsed ? 'justify-center px-3 py-5' : 'px-5 py-5',
      )}>
        {collapsed ? (
          <img src="/outbili/v4-icon.png" alt="V4" className="h-9 w-9 object-contain transition-all duration-300" />
        ) : (
          <img src="/outbili/logo-white.png" alt="V4 Bilinski&Co" className="h-12 w-auto object-contain transition-all duration-300" />
        )}
      </div>

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
            onClick={onNavClick}
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
          onClick={onNavClick}
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
    </>
  )
}

export function Sidebar() {
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const location = useLocation()

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out',
          'bg-surface/80 backdrop-blur-xl border-r border-border',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-50 transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={cn(
            'absolute left-0 top-0 h-full w-[280px] flex flex-col',
            'bg-surface/95 backdrop-blur-xl border-r border-border',
            'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.05] transition-colors cursor-pointer z-10"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Desktop collapse toggle */}
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
