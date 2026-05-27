import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Columns3, MessageSquare, Smartphone, BarChart3, Settings, Shield, LogOut, ChevronLeft, ChevronRight, X, Sun, Moon } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSidebar } from '../../lib/sidebar-context'
import { useAuth } from '../../lib/auth-context'
import { useTheme } from '../../lib/theme-context'
import { useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Pesquisa' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Columns3, label: 'Pipeline' },
  { to: '/inbox', icon: MessageSquare, label: 'Mensagens', comingSoon: true },
  { to: '/campaigns', icon: Smartphone, label: 'Campanhas', comingSoon: true },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
]

function SidebarContent({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
          <img src={theme === 'light' ? '/outbili/logo-black.png' : '/outbili/logo-white.png'} alt="V4 Bilinski&Co" className="h-12 w-auto object-contain transition-all duration-300" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {!collapsed && (
          <p className="text-caption uppercase tracking-[0.15em] text-text-muted font-medium px-3 mb-3 animate-[fade-in_0.2s_ease-out]">Menu</p>
        )}
        {navItems.map((item) => {
          const disabled = !!(item as { comingSoon?: boolean }).comingSoon
          if (disabled) {
            return (
              <div
                key={item.to}
                title={collapsed ? `${item.label} (em breve)` : 'Em breve. Funcionalidade em desenvolvimento.'}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-not-allowed select-none opacity-40',
                  'text-text-muted',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span className="text-[8px] font-semibold uppercase tracking-wide bg-elevated-3 text-text-muted px-1.5 py-0.5 rounded-full leading-none shrink-0">em breve</span>
                  </span>
                )}
              </div>
            )
          }
          return (
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
                    : 'text-text-secondary hover:text-text-primary hover:bg-elevated-1',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-3 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          title={collapsed ? 'Configurações' : undefined}
          onClick={onNavClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive ? 'bg-red/10 text-red' : 'text-text-secondary hover:text-text-primary hover:bg-elevated-1',
              collapsed && 'justify-center px-2',
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            title={collapsed ? 'Administração' : undefined}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive ? 'bg-red/10 text-red' : 'text-text-secondary hover:text-text-primary hover:bg-elevated-1',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <Shield className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Administração</span>}
          </NavLink>
        )}

        {/* Toggle tema claro/escuro */}
        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo escuro') : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full text-text-secondary hover:text-text-primary hover:bg-elevated-2 cursor-pointer',
            collapsed && 'justify-center px-2',
          )}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>}
        </button>

        {/* User info + logout */}
        {user && (
          <div className={cn('flex items-center gap-2 px-3 py-2', collapsed && 'justify-center px-2')}>
            <div className="w-7 h-7 rounded-full bg-red/20 flex items-center justify-center text-label font-bold text-red shrink-0">
              {user.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-label font-medium text-text-primary truncate">{user.fullName}</p>
                <p className="text-micro text-text-muted truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              title="Sair"
              className={cn('p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors cursor-pointer', collapsed && 'ml-0')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
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
          className="absolute inset-0 bg-overlay backdrop-blur-sm"
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
            className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-elevated-2 transition-colors cursor-pointer z-10"
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
