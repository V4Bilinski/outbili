import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Menu, X, LogIn } from 'lucide-react'

const SECTIONS = [
  { id: 'hero', label: 'Início' },
  { id: 'problema', label: 'O Problema' },
  { id: 'montagem', label: 'Funil' },
  { id: 'travas', label: 'Travas' },
  { id: 'mecanismo', label: 'Fontes' },
  { id: 'como-comecar', label: 'Como Começar' },
  { id: 'compromisso', label: 'Compromisso' },
]

/**
 * InstitucionalNav — Top fixo minimalista.
 * - scrollY = 0: 100% transparente, sem border, sem shadow (só os links flutuam).
 * - scrollY > 40: glass aparece suavemente (bg blur + border + shadow) com Framer Motion.
 * - Mobile: hamburger dropdown.
 */
export function InstitucionalNav() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('hero')

  const { scrollY } = useScroll()
  // Transparente no topo, glass ao scroll
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85])
  const blurAmount = useTransform(scrollY, [0, 80], [0, 20])
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.25])
  const shadowOpacity = useTransform(scrollY, [0, 80], [0, 0.4])

  // IntersectionObserver: highlight active section
  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setOpen(false)
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Background layer (animado independente) */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: useTransform(bgOpacity, (v) => `rgba(9, 9, 11, ${v})`),
          backdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
          WebkitBackdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
          borderBottom: useTransform(
            borderOpacity,
            (v) => `1px solid rgba(230, 51, 41, ${v})`,
          ),
          boxShadow: useTransform(
            shadowOpacity,
            (v) => `0 4px 24px rgba(0, 0, 0, ${v})`,
          ),
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo — altura proporcional aos labels do menu */}
          <motion.button
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            whileHover={{ opacity: 0.75 }}
            transition={{ duration: 0.2 }}
            aria-label="Voltar ao topo"
          >
            <img
              src="/outbili/logo-white.png"
              alt="V4 Bilinski &amp; Co"
              className="h-9 md:h-10 w-auto"
            />
          </motion.button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {SECTIONS.map((section, i) => (
              <motion.button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                whileHover={{ y: -1 }}
                className={[
                  'relative px-3 py-2 text-[12px] font-bold uppercase tracking-[0.12em] rounded-md transition-colors duration-200 cursor-pointer',
                  active === section.id
                    ? 'text-[#FF6666]'
                    : 'text-text-secondary hover:text-white',
                ].join(' ')}
              >
                {section.label}
                {active === section.id && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute inset-0 -z-10 rounded-md bg-red/[0.12] border border-red/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {active === section.id && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red shadow-[0_0_8px_rgba(230,51,41,0.7)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>

          {/* Right: CTA + mobile toggle */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => navigate('/login')}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7, ease: 'easeOut' }}
              whileHover={{ y: -1 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-red hover:bg-red-vivid text-white font-bold text-[12px] uppercase tracking-[0.1em] transition-all duration-300 shadow-[0_0_16px_rgba(230,51,41,0.35)] hover:shadow-[0_0_28px_rgba(230,51,41,0.55)] ring-1 ring-red/40 hover:ring-red cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              Acessar
            </motion.button>

            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-red/30 bg-red/[0.10] hover:bg-red/[0.18] hover:border-red/50 text-white transition-all cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden border-t border-red/20 overflow-hidden"
            >
              <div className="py-3 space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={[
                      'block w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-[0.1em] transition-colors cursor-pointer',
                      active === section.id
                        ? 'text-[#FF6666] bg-red/[0.12] border-l-2 border-red'
                        : 'text-text-secondary hover:text-white hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    {section.label}
                  </button>
                ))}
                <button
                  onClick={() => navigate('/login')}
                  className="sm:hidden flex items-center justify-center gap-2 w-full mt-2 px-4 py-3 rounded-lg bg-red text-white font-bold text-sm uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(230,51,41,0.4)] cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  Acessar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
