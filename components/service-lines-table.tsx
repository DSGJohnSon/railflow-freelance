import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconLayoutList,
  IconPlayerPauseFilled,
  IconProgress,
} from "@tabler/icons-react"

import {
  DeleteServiceLineDialog,
  EditServiceLineDialog,
  PauseServiceLineDialog,
  StartServiceLineDialog,
} from "@/components/admin/service-line-dialogs"
import { BillingBar } from "@/components/billing-bar"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Client } from "@/data/types"
import { formatAmount, formatDate } from "@/lib/format"
import type { LineState, LineSummary } from "@/lib/queries"
import { cn } from "@/lib/utils"

const states = {
  SETTLED: {
    label: "Soldé",
    icon: IconCircleCheckFilled,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
  BILLING: {
    label: "En cours",
    icon: IconProgress,
    className:
      "bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-400",
  },
  // Deliberately not amber: that colour already means "en attente de
  // règlement", and a pause is a decision, not an unpaid bill.
  PAUSED: {
    label: "En pause",
    icon: IconPlayerPauseFilled,
    className:
      "bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400",
  },
  PENDING: {
    label: "À livrer",
    icon: IconCircleDashed,
    className: "bg-muted text-muted-foreground",
  },
} satisfies Record<
  LineState,
  { label: string; icon: typeof IconProgress; className: string }
>

function LineStateBadge({ state }: { state: LineState }) {
  const { label, icon: Icon, className } = states[state]

  return (
    <Badge variant="secondary" className={className}>
      <Icon />
      {label}
    </Badge>
  )
}

/**
 * How far the line has gone through its plan.
 *
 * A line nobody has invoiced yet states the plan instead of a rank, because
 * "0/12" suggests a schedule that has started and stalled — what is true is
 * that the instalments are agreed and the clock has not been set running yet.
 */
function Progress({ summary }: { summary: LineSummary }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs text-muted-foreground tabular-nums">
        {summary.billed === 0
          ? `${summary.count} mensualités prévues`
          : `mensualité ${summary.billed}/${summary.count}`}
      </span>
      <BillingBar
        size="sm"
        total={summary.total}
        paid={summary.paid}
        waiting={summary.waiting}
        planned={summary.planned}
        notStarted={summary.unscheduled}
      />
    </div>
  )
}

/**
 * What drives the line's dates: the delivery it started from, the one it is
 * waiting for, or the fact that none is fixed.
 *
 * A start date still ahead reads as a plan, not as history — "Démarré le
 * 1 mars 2027" on a line nobody has delivered would be plainly false.
 */
function startNotice({ line, state }: LineSummary) {
  // What a paused line owes is not in question; when it starts again is. That
  // is the only thing worth the line of text.
  if (state === "PAUSED") {
    return "Reprise à planifier"
  }

  if (!line.startedOn) {
    return state === "PENDING"
      ? "Démarrage à la livraison"
      : "Facturation en cours"
  }

  return state === "PENDING"
    ? `Démarrage prévu le ${formatDate(line.startedOn)}`
    : `Démarré le ${formatDate(line.startedOn)}`
}

function LineLabel({
  summary,
  entityLabel,
}: {
  summary: LineSummary
  /** Shown only when the project bills through several entities. */
  entityLabel?: string
}) {
  return (
    <div className="min-w-0">
      <span className="block font-medium">{summary.line.label}</span>
      <span className="block text-xs text-muted-foreground">
        {startNotice(summary)}
      </span>
      {entityLabel ? (
        <Badge variant="outline" className="mt-1.5 text-muted-foreground">
          {entityLabel}
        </Badge>
      ) : null}
    </div>
  )
}

/**
 * Each action appears only where it has something to act on: pausing needs
 * instalments on the calendar, starting needs instalments off it. A line whose
 * whole plan is placed offers neither, so no second pass can stack a duplicate
 * set of instalments on top of the first.
 */
function RowActions({
  summary,
  projectId,
  clients,
  projectClientId,
}: {
  summary: LineSummary
  projectId: string
  clients: Client[]
  projectClientId: string
}) {
  const remaining = summary.count - summary.placed

  return (
    <div className="flex justify-end gap-0.5">
      {summary.planned > 0 ? (
        <PauseServiceLineDialog
          projectId={projectId}
          line={summary.line}
          planned={summary.planned}
        />
      ) : null}
      {remaining > 0 ? (
        <StartServiceLineDialog
          projectId={projectId}
          line={summary.line}
          remaining={remaining}
        />
      ) : null}
      <EditServiceLineDialog
        projectId={projectId}
        line={summary.line}
        clients={clients}
        projectClientId={projectClientId}
      />
      <DeleteServiceLineDialog projectId={projectId} line={summary.line} />
    </div>
  )
}

function totals(summaries: LineSummary[]) {
  return summaries.reduce(
    (acc, summary) => ({
      total: acc.total + summary.total,
      paid: acc.paid + summary.paid,
      outstanding: acc.outstanding + summary.outstanding,
    }),
    { total: 0, paid: 0, outstanding: 0 }
  )
}

/**
 * The prestations sold, each with its own tally.
 *
 * This is the view the contract-wide figures cannot give: it separates a
 * prestation being paid off from one still waiting on delivery, so the client
 * can see that the bulk of the remainder is not overdue — it is not started.
 */
function ServiceLinesTable({
  lines,
  projectId,
  clients,
  projectClientId,
  editable = false,
}: {
  lines: LineSummary[]
  projectId: string
  clients: Client[]
  /** Owner of the project — the default billing entity of every line. */
  projectClientId: string
  editable?: boolean
}) {
  if (lines.length === 0) {
    return (
      <EmptyState
        icon={IconLayoutList}
        title="Aucun poste"
        description={
          editable
            ? "Découpez un devis en prestations avec « Ajouter un poste » : chacune porte son propre échéancier, et une facture mensuelle peut en charger plusieurs."
            : "Ce projet est facturé d'un bloc : aucun découpage par prestation n'est enregistré sur ses devis."
        }
      />
    )
  }

  const footer = totals(lines)

  // Tags appear only once the postes split across entities: on a project
  // billed to a single structure they would repeat the client's name per row.
  const entityOf = (summary: LineSummary) =>
    summary.line.billedTo ?? projectClientId
  const multiEntity = new Set(lines.map(entityOf)).size > 1
  const entityLabelFor = (summary: LineSummary) => {
    if (!multiEntity) {
      return undefined
    }

    const entity = entityOf(summary)
    return clients.find((client) => client.id === entity)?.label ?? entity
  }

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {/* Stacked below `md`, where six columns stop fitting. Only one of the
          two layouts is ever rendered. */}
      <ul className="divide-y md:hidden">
        {lines.map((summary) => (
          <li key={summary.line.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <LineLabel
                summary={summary}
                entityLabel={entityLabelFor(summary)}
              />
              <LineStateBadge state={summary.state} />
            </div>

            <Progress summary={summary} />

            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Total</dt>
                <dd className="tabular-nums">{formatAmount(summary.total)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payé</dt>
                <dd className="text-emerald-700 tabular-nums dark:text-emerald-400">
                  {formatAmount(summary.paid)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reste</dt>
                <dd className="tabular-nums">
                  {formatAmount(summary.outstanding)}
                </dd>
              </div>
            </dl>

            {editable ? (
              <RowActions
                summary={summary}
                projectId={projectId}
                clients={clients}
                projectClientId={projectClientId}
              />
            ) : null}
          </li>
        ))}
      </ul>

      <Table containerClassName="hidden scroll-shadow-x md:block">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-4">Poste</TableHead>
            <TableHead className="w-48">Avancement</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Payé</TableHead>
            <TableHead className="text-right">Reste à payer</TableHead>
            <TableHead className={editable ? "text-right" : "pr-4 text-right"}>
              Statut
            </TableHead>
            {editable ? (
              <TableHead className="pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>

        <TableBody>
          {lines.map((summary) => (
            <TableRow key={summary.line.id}>
              <TableCell className="max-w-72 py-3 pl-4 whitespace-normal">
                <LineLabel
                  summary={summary}
                  entityLabel={entityLabelFor(summary)}
                />
              </TableCell>
              <TableCell>
                <Progress summary={summary} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(summary.total)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  summary.paid > 0 && "text-emerald-700 dark:text-emerald-400"
                )}
              >
                {formatAmount(summary.paid)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(summary.outstanding)}
              </TableCell>
              <TableCell className={editable ? "" : "pr-4"}>
                <div className="flex justify-end">
                  <LineStateBadge state={summary.state} />
                </div>
              </TableCell>
              {editable ? (
                <TableCell className="pr-4">
                  <RowActions
                    summary={summary}
                    projectId={projectId}
                    clients={clients}
                    projectClientId={projectClientId}
                  />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell className="pl-4">Total des postes</TableCell>
            <TableCell />
            <TableCell className="text-right tabular-nums">
              {formatAmount(footer.total)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(footer.paid)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatAmount(footer.outstanding)}
            </TableCell>
            <TableCell className="pr-4" />
            {editable ? <TableCell className="pr-4" /> : null}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export { ServiceLinesTable }
