import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toaster } from 'sonner'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <BottomNav />
      <main className="md:ml-[260px] pb-24 md:pb-0 min-h-screen">
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
