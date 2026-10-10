import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Decorative: the name it abbreviates is always written out beside it. Tinted
 * with the accent, the app's only colour besides the status tones.
 */
function InitialsAvatar({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary-strong",
        className
      )}
    >
      {initials(label)}
    </span>
  )
}

export { InitialsAvatar }
