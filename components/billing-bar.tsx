import { formatAmount } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * One colour per stage of the money, shared with the figures beside the bar so
 * a segment and its amount are read as the same thing.
 */
export const billingTones = {
  paid: "bg-emerald-600 dark:bg-emerald-500",
  waiting: "bg-amber-500 dark:bg-amber-400",
  planned: "bg-foreground/30",
  notStarted: "bg-foreground/10",
} as const

/**
 * The four stages a euro of the contract can be in. They decompose the total
 * exactly, which is what lets the bar be drawn to scale.
 */
export type BillingBreakdown = {
  total: number
  paid: number
  waiting: number
  planned: number
  notStarted: number
}

const labels: Record<keyof typeof billingTones, string> = {
  paid: "payé",
  waiting: "en attente",
  planned: "planifié",
  notStarted: "non démarré",
}

const order = ["paid", "waiting", "planned", "notStarted"] as const

/**
 * A contract — or a single service line — broken into its four stages, drawn
 * to scale.
 *
 * A single filled bar would be read as "how far along is this", which misleads
 * the moment part of the scope has not started: a client who is perfectly up
 * to date still shows nearly empty, because the bulk is waiting on delivery
 * rather than on payment. Showing the four stages at once says what the one
 * number cannot — the remainder is not late, it is not due yet.
 */
function BillingBar({
  className,
  size = "default",
  ...breakdown
}: BillingBreakdown & {
  className?: string
  size?: "default" | "sm"
}) {
  const { total } = breakdown

  // Read as one picture rather than four bars, so it is labelled as an image
  // and described in full — a progressbar would have to pick a single value.
  const description =
    total === 0
      ? "Rien de devisé"
      : order
          .filter((key) => breakdown[key] > 0)
          .map((key) => `${formatAmount(breakdown[key])} ${labels[key]}`)
          .join(", ")

  return (
    <div
      role="img"
      aria-label={`Sur ${formatAmount(total)} : ${description}.`}
      className={cn(
        "flex w-full gap-px overflow-hidden rounded-full bg-foreground/10",
        size === "sm" ? "h-1" : "h-1.5",
        className
      )}
    >
      {order.map((key) => (
        <div
          key={key}
          className={billingTones[key]}
          style={{
            width: total === 0 ? 0 : `${(breakdown[key] / total) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export { BillingBar }
