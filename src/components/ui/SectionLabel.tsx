export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-0.5 bg-red" />
      <span className="text-label font-semibold tracking-[0.1em] uppercase text-red">
        {children}
      </span>
    </div>
  )
}

export function SectionDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-red/20 to-transparent my-8" />
  )
}
