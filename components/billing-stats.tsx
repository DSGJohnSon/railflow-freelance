import { BillingBar, billingTones } from "@/components/billing-bar"
import { Card } from "@/components/ui/card"
import { formatAmount } from "@/lib/format"
import type { BillingSummary } from "@/lib/queries"
import { cn } from "@/lib/utils"

function Stat({
  label,
  amount,
  tone,
  emphasis,
}: {
  label: string
  amount: number
  /** Ties the figure to its segment of the bar below. */
  tone?: keyof typeof billingTones
  emphasis?: "paid" | "waiting"
}) {
  return (
    <div className="px-(--card-spacing) py-4 first:pt-0 sm:py-0 sm:first:pt-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {tone ? (
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", billingTones[tone])}
          />
        ) : null}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-heading text-xl tabular-nums",
          emphasis === "paid" && "text-emerald-700 dark:text-emerald-400",
          emphasis === "waiting" && "text-amber-700 dark:text-amber-400"
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
      <dl className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
        <Stat label="Total devisé" amount={summary.quoted} />
        <Stat label="Payé" amount={summary.paid} tone="paid" emphasis="paid" />
        <Stat
          label="En attente"
          amount={summary.waiting}
          tone="waiting"
          emphasis="waiting"
        />
        <Stat label="Planifié" amount={summary.planned} tone="planned" />
        <Stat
          label="Non démarré"
          amount={summary.notStarted}
          tone="notStarted"
        />
      </dl>

      <div className="space-y-2 px-(--card-spacing)">
        <BillingBar
          total={summary.quoted}
          paid={summary.paid}
          waiting={summary.waiting}
          planned={summary.planned}
          notStarted={summary.notStarted}
        />
        {/* "du contrat" rather than a bare percentage: the figure measures the
            whole scope, including what has not been delivered yet. */}
        <p className="text-xs text-muted-foreground">
          <span className="tabular-nums">{summary.progress}%</span> du contrat
          réglé · reste{" "}
          <span className="tabular-nums">{formatAmount(summary.upcoming)}</span>{" "}
          à encaisser
        </p>
      </div>
    </Card>
  )
}

export { BillingStats }
