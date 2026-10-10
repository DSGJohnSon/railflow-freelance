import {
  IconCalendarEvent,
  IconCircleCheck,
  IconClockHour4,
  IconHourglassEmpty,
  type Icon,
} from "@tabler/icons-react"

import { BillingBar, billingTones } from "@/components/billing-bar"
import { Card } from "@/components/ui/card"
import { formatAmount } from "@/lib/format"
import type { BillingSummary } from "@/lib/queries"
import { cn } from "@/lib/utils"

/**
 * The icon tile of each stage, in the stage's own colour — the same one as its
 * segment of the bar, so a card and a segment are read as the same thing.
 */
const tiles = {
  paid: "bg-success/15 text-success-strong",
  waiting: "bg-warning/20 text-warning-strong",
  planned: "bg-foreground/10 text-foreground",
  notStarted: "bg-foreground/5 text-muted-foreground",
} satisfies Record<keyof typeof billingTones, string>

function Stat({
  label,
  amount,
  total,
  tone,
  icon: Icon,
}: {
  label: string
  amount: number
  /** What the share at the bottom of the card is measured against. */
  total: number
  tone: keyof typeof billingTones
  icon: Icon
}) {
  const share = total === 0 ? 0 : Math.round((amount / total) * 100)

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 text-base font-semibold text-foreground/70">
          {label}
        </p>
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl",
            tiles[tone]
          )}
        >
          <Icon className="size-6" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-wide tabular-nums">
        {formatAmount(amount)}
      </p>
      <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", billingTones[tone])}
        />
        <span>
          <span className="text-foreground tabular-nums">{share}%</span> du
          contrat
        </span>
      </p>
    </Card>
  )
}

function BillingStats({ summary }: { summary: BillingSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <Stat
          label="Payé"
          amount={summary.paid}
          total={summary.quoted}
          tone="paid"
          icon={IconCircleCheck}
        />
        <Stat
          label="En attente"
          amount={summary.waiting}
          total={summary.quoted}
          tone="waiting"
          icon={IconClockHour4}
        />
        <Stat
          label="Planifié"
          amount={summary.planned}
          total={summary.quoted}
          tone="planned"
          icon={IconCalendarEvent}
        />
        <Stat
          label="Non démarré"
          amount={summary.notStarted}
          total={summary.quoted}
          tone="notStarted"
          icon={IconHourglassEmpty}
        />
      </div>

      <Card className="gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold sm:text-2xl">
              Avancement du contrat
            </h2>
            {/* "du contrat" rather than a bare percentage: the figure measures
                the whole scope, including what has not been delivered yet. */}
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {summary.progress}%
              </span>{" "}
              du contrat réglé · reste{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatAmount(summary.upcoming)}
              </span>{" "}
              à encaisser
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm font-semibold text-muted-foreground">
              Total devisé
            </p>
            <p className="text-[1.75rem] leading-tight font-bold tracking-wide tabular-nums">
              {formatAmount(summary.quoted)}
            </p>
          </div>
        </div>

        <BillingBar
          size="lg"
          total={summary.quoted}
          paid={summary.paid}
          waiting={summary.waiting}
          planned={summary.planned}
          notStarted={summary.notStarted}
        />
      </Card>
    </div>
  )
}

export { BillingStats }
