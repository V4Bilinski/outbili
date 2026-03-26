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
        'pb-24 md:pb-0 pt-14 md:pt-0 min-h-screen transition-all duration-300 ease-in-out',
        collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]',
      )}>
        <div className="p-5 md:p-8 max-w-[1400px] mx-auto">
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
