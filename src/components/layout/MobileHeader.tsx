import { Menu } from 'lucide-react'
import { useSidebar } from '../../lib/sidebar-context'

export function MobileHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-surface/80 backdrop-blur-xl border-b border-border">
      <button
        onClick={toggleMobile}
        className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-elevated-2 transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <img src="/outbili/v4-icon.png" alt="V4" className="h-6 w-6 object-contain rounded" />
        <span className="text-sm font-semibold text-text-primary">OUTBILI <span className="text-text-muted font-normal">· V4 Bilinski &amp;Co</span></span>
      </div>
      <div className="w-9" />
    </header>
  )
}
