import { cn } from "@/lib/utils"

/**
 * Static, zero-JS progress bar for the share of a project already settled.
 */
function AmountBar({
  value,
  className,
  label = "Part réglée",
}: {
  /** 0-100 */
  value: number
  className?: string
  label?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export { AmountBar }
