import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../lib/theme-context'
import { cn } from '../../lib/cn'

/**
 * ThemeToggle — botão quadrado Sun/Moon para alternar tema claro/escuro.
 * Componente único reutilizado em toda a infraestrutura (TopBar do app,
 * MobileHeader e nav institucional), garantindo comportamento idêntico.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface/40 hover:bg-surface/70 text-text-secondary hover:text-text-primary transition-all cursor-pointer',
        className,
      )}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
