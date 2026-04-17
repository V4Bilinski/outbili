import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { Toaster } from 'sonner'
import { SidebarProvider, useSidebar } from '../../lib/sidebar-context'
import { cn } from '../../lib/cn'

function LayoutInner() {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <BottomNav />
      <MobileHeader />
      <main className={cn(
        'pb-24 md:pb-0 pt-14 md:pt-0 min-h-screen transition-all duration-300 ease-in-out relative',
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
