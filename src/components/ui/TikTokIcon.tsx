import { cn } from '../../lib/cn'

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn('inline-block shrink-0', className)}
    >
      <path d="M19.321 5.562a5.124 5.124 0 0 1-3.414-1.267 5.124 5.124 0 0 1-1.537-2.893h-3.264v12.634c0 1.528-1.242 2.77-2.77 2.77a2.77 2.77 0 1 1 0-5.54c.285 0 .559.044.819.126v-3.322a6.104 6.104 0 0 0-.819-.056 6.103 6.103 0 1 0 6.103 6.103V8.877a8.355 8.355 0 0 0 4.882 1.573V7.186a4.926 4.926 0 0 1 0-1.624z" />
    </svg>
  )
}
