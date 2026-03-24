import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Toaster } from 'sonner'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <BottomNav />
      <main className="md:ml-[256px] pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            border: '1px solid rgba(120, 113, 108, 0.3)',
            color: '#FFFFFF',
          },
        }}
      />
    </div>
  )
}
