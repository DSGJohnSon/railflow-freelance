import { AmountBar } from "@/components/amount-bar"
import { Card } from "@/components/ui/card"
import { formatAmount } from "@/lib/format"
import type { BillingSummary } from "@/lib/queries"
import { cn } from "@/lib/utils"

function Stat({
  label,
  amount,
  tone,
}: {
  label: string
  amount: number
  tone?: "paid" | "waiting"
}) {
  return (
    <div className="px-(--card-spacing) py-4 first:pt-0 sm:py-0 sm:first:pt-0">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-heading text-xl tabular-nums",
          tone === "paid" && "text-emerald-700 dark:text-emerald-400",
          tone === "waiting" && "text-amber-700 dark:text-amber-400"
        )}
      >
        {formatAmount(amount)}
      </dd>
    </div>
  )
}

function BillingStats({ summary }: { summary: BillingSummary }) {
  return (
    <Card>
      <dl className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <Stat label="Total devisé" amount={summary.quoted} />
        <Stat label="Payé" amount={summary.paid} tone="paid" />
        <Stat label="En attente" amount={summary.waiting} tone="waiting" />
        <Stat label="À venir" amount={summary.upcoming} />
      </dl>

      <div className="flex items-center gap-3 px-(--card-spacing)">
        <AmountBar value={summary.progress} className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {summary.progress}% réglé
        </span>
      </div>
    </Card>
  )
}

export { BillingStats }
