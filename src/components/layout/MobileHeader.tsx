import { Menu } from 'lucide-react'
import { useSidebar } from '../../lib/sidebar-context'

export function MobileHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-surface/80 backdrop-blur-xl border-b border-border">
      <button
        onClick={toggleMobile}
        className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/[0.05] transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>
      <img src="/outbili/logo-white.png" alt="V4 Bilinski" className="h-7 w-auto object-contain" />
      <div className="w-9" />
    </header>
  )
}
