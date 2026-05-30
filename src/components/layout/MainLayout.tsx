import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { Toaster } from 'sonner'
import { SidebarProvider, useSidebar } from '../../lib/sidebar-context'
import { useAuth } from '../../lib/auth-context'
import { PasswordResetModal } from '../onboarding/PasswordResetModal'
import { WelcomeTour } from '../onboarding/WelcomeTour'
import { cn } from '../../lib/cn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { OrbBackground } from '../institucional/effects'

function LayoutInner() {
  const { collapsed } = useSidebar()
  const { needsPasswordReset } = useAuth()
  const location = useLocation()
  const isInbox = location.pathname.startsWith('/inbox')

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <BottomNav />
      <MobileHeader />
      {/* TopBar desktop — barra fina fixa com o toggle de tema no canto superior direito.
          Oculta no inbox (tela fullscreen com layout próprio). */}
      {!isInbox && (
        <div className={cn(
          'hidden md:flex fixed top-0 right-0 z-30 h-[52px] items-center justify-end px-6 gap-3',
          'bg-bg/50 backdrop-blur-md border-b border-border/50 transition-all duration-300 ease-in-out',
          collapsed ? 'left-[72px]' : 'left-[260px]',
        )}>
          <ThemeToggle />
        </div>
      )}
      <main className={cn(
        'pb-24 md:pb-0 pt-14 min-h-screen transition-all duration-300 ease-in-out relative',
        isInbox ? 'md:pt-0' : 'md:pt-[52px]',
        collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]',
      )}>
        {/* Background effects — replicados da página institucional */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {/* Radial glow principal — mesmo da institucional */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(230,51,41,0.08), transparent)',
            }}
          />
          {/* Grid pattern — 60px como institucional */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(244,244,245,1) 1px, transparent 1px), linear-gradient(90deg, rgba(244,244,245,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Ambient glow top center */}
          <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-red/[0.04] blur-[140px]" />
          {/* Ambient glow right */}
          <div className="absolute top-1/3 -right-1/4 w-[500px] h-[500px] rounded-full bg-red/[0.03] blur-[120px]" />
          {/* Orbes ambientes sutis (efeito notio portado) — clima da landing, sem competir com dados */}
          <OrbBackground className="top-[8%] left-[10%] w-[26rem] h-[26rem] opacity-50" />
          <OrbBackground className="bottom-[6%] right-[8%] w-[22rem] h-[22rem] opacity-40" />
        </div>
        <div className="p-5 md:p-8 max-w-[1400px] mx-auto relative" style={{ zIndex: 1 }}>
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 18, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#F4F4F5',
            borderRadius: '12px',
          },
        }}
      />
      {/* Onboarding: troca de senha obrigatoria no 1o acesso, senao tour de boas-vindas */}
      {needsPasswordReset ? <PasswordResetModal /> : <WelcomeTour />}
    </div>
  )
}

export function MainLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  )
}
