import Link from "next/link"
import { IconCalendarDue } from "@tabler/icons-react"

import type { Client, DueState } from "@/data/types"
import { DeleteDueDialog, EditDueDialog } from "@/components/admin/due-dialogs"
import { DocumentLink } from "@/components/document-link"
import { DueStateBadge } from "@/components/due-state-badge"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatAmount,
  formatShortDate,
  startOfToday,
  toIsoDate,
} from "@/lib/format"
import { paymentDeadline } from "@/lib/payment-terms"
import { breakdownOf, dueState, type DueWithProject } from "@/lib/queries"
import { cn } from "@/lib/utils"

type RowProps = {
  due: DueWithProject
  state: DueState
  /**
   * Rows this row's date cell spans — dues of one project falling on the same
   * day are one échéance split into several invoices, and share a single date
   * cell. `0` on the rows whose date is carried by an earlier sibling.
   */
  span: number
  /** The invoice's recipient, named when the month bills several entities. */
  entityLabel?: string
  showProject: boolean
  editable: boolean
}

/**
 * The deadline leads and the issue date follows, because the deadline is what
 * the badge is judged against: showing the issue date on its own would leave a
 * row reading "01/08 — À venir" a month after it was issued.
 */
function DueDate({ due, late }: { due: DueWithProject; late: boolean }) {
  const deadline = paymentDeadline(due)

  return (
    <div className="tabular-nums">
      <time
        dateTime={toIsoDate(deadline)}
        className={cn(
          "block",
          late
            ? "font-medium text-red-700 dark:text-red-400"
            : "text-muted-foreground"
        )}
      >
        {formatShortDate(deadline)}
      </time>
      {/* No PDF means the invoice has not actually gone out yet, so there is no
          issue date to announce — only a slot in the schedule. */}
      <span className="block text-xs text-muted-foreground/70">
        {due.invoice?.file ? (
          <>
            émise le{" "}
            <time dateTime={toIsoDate(due.date)}>
              {formatShortDate(due.date)}
            </time>
          </>
        ) : (
          "Pas encore émis"
        )}
      </span>
      {/* Stated as a receipt, never compared to the deadline: the money is in,
          and a settled invoice has nothing left to answer for. */}
      {due.paidOn ? (
        <span className="block text-xs text-emerald-700 dark:text-emerald-400">
          réglée le{" "}
          <time dateTime={toIsoDate(due.paidOn)}>
            {formatShortDate(due.paidOn)}
          </time>
        </span>
      ) : null}
    </div>
  )
}

/**
 * What the invoice charges, line by line.
 *
 * Since an invoice is identified by its own number, the label alone no longer
 * says what is inside it — a monthly invoice covers every prestation currently
 * being billed. This is where "AC_2026_0011" becomes readable.
 */
function InvoiceBreakdown({ due }: { due: DueWithProject }) {
  const entries = breakdownOf(due)

  if (entries.length === 0) {
    return null
  }

  // Whatever the shares do not account for. Zero in normal use; it appears
  // when an invoice total was edited without its breakdown following, and is
  // shown rather than hidden so the discrepancy cannot pass unnoticed.
  const unallocated =
    (due.invoice?.amount ?? 0) -
    entries.reduce((total, entry) => total + entry.amount, 0)

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs font-normal text-muted-foreground">
      {entries.map((entry) => (
        <li key={`${entry.line.id}-${entry.index}`} className="flex gap-2">
          <span className="min-w-0 flex-1">
            {entry.line.label}{" "}
            <span className="tabular-nums">
              · {entry.index}/{entry.count}
            </span>
          </span>
          <span className="shrink-0 tabular-nums">
            {formatAmount(entry.amount)}
          </span>
        </li>
      ))}

      {unallocated !== 0 ? (
        <li className="flex gap-2 text-red-700 dark:text-red-400">
          <span className="min-w-0 flex-1">Non ventilé</span>
          <span className="shrink-0 tabular-nums">
            {formatAmount(unallocated)}
          </span>
        </li>
      ) : null}
    </ul>
  )
}

function InvoiceLabel({
  due,
  entityLabel,
}: {
  due: DueWithProject
  entityLabel?: string
}) {
  return (
    <>
      {entityLabel ? (
        <Badge
          variant="outline"
          className="mb-1.5 block w-fit font-normal text-muted-foreground"
        >
          {entityLabel}
        </Badge>
      ) : null}
      {due.invoice ? (
        <>
          <DocumentLink document={due.invoice} />
          <InvoiceBreakdown due={due} />
        </>
      ) : (
        <span className="text-muted-foreground">Facture non émise</span>
      )}
    </>
  )
}

function ProjectLink({
  due,
  className,
}: {
  due: DueWithProject
  className?: string
}) {
  return (
    <Link
      // Always the owner's page: a due can be listed on the page of the
      // entity it is billed to, where the page's own client is the wrong one.
      href={`/clients/${due.project.clientId}/projects/${due.project.id}`}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:underline",
        className
      )}
    >
      {due.project.title}
    </Link>
  )
}

function RowActions({ due }: { due: DueWithProject }) {
  const { project, ...rest } = due

  return (
    <div className="flex justify-end gap-0.5">
      <EditDueDialog projectId={project.id} due={rest} />
      <DeleteDueDialog projectId={project.id} due={rest} />
    </div>
  )
}

/** The row as a table row — desktop, where the columns have room to align. */
function DueRow({
  due,
  state,
  span,
  entityLabel,
  showProject,
  editable,
}: RowProps) {
  const late = state === "LATE"

  return (
    <TableRow
      className={cn(
        late &&
          "bg-red-500/4 hover:bg-red-500/8 dark:bg-red-400/4 dark:hover:bg-red-400/8"
      )}
    >
      {/* One date cell for the whole group: an échéance split across entities
          is one deadline answered by several invoices, and the layout says so. */}
      {span > 0 ? (
        <TableCell
          className="pl-4 align-top"
          rowSpan={span > 1 ? span : undefined}
        >
          <DueDate due={due} late={late} />
          {span > 1 ? (
            <span className="mt-1 block text-xs text-muted-foreground/70">
              {span} factures
            </span>
          ) : null}
        </TableCell>
      ) : null}

      {/* Every cell aligns to the top: the breakdown makes the label cell the
          tallest, and vertically centred amounts would drift away from the
          invoice they belong to. */}
      <TableCell className="max-w-88 align-top font-medium whitespace-normal">
        <InvoiceLabel due={due} entityLabel={entityLabel} />
      </TableCell>

      {showProject ? (
        <TableCell className="align-top">
          <ProjectLink due={due} />
        </TableCell>
      ) : null}

      <TableCell className="text-right align-top tabular-nums">
        {due.invoice ? formatAmount(due.invoice.amount) : "—"}
      </TableCell>

      <TableCell className={cn("align-top", !editable && "pr-4")}>
        <div className="flex justify-end">
          <DueStateBadge state={state} />
        </div>
      </TableCell>

      {editable ? (
        <TableCell className="pr-4 align-top">
          <RowActions due={due} />
        </TableCell>
      ) : null}
    </TableRow>
  )
}

/**
 * The same row stacked — mobile, where six columns cannot fit. Date and state
 * lead, since they are the pair being scanned for; the amount closes the card.
 */
function DueCard({ due, state, entityLabel, showProject, editable }: RowProps) {
  const late = state === "LATE"

  return (
    <li
      className={cn("space-y-2 p-4", late && "bg-red-500/4 dark:bg-red-400/4")}
    >
      <div className="flex items-start justify-between gap-3 text-sm">
        <DueDate due={due} late={late} />
        <DueStateBadge state={state} />
      </div>

      <div className="text-sm font-medium">
        <InvoiceLabel due={due} entityLabel={entityLabel} />
      </div>

      {showProject ? <ProjectLink due={due} className="block text-sm" /> : null}

      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-base tabular-nums">
          {due.invoice ? formatAmount(due.invoice.amount) : "—"}
        </span>
        {editable ? <RowActions due={due} /> : null}
      </div>
    </li>
  )
}

function DuesTable({
  dues,
  clients = [],
  showProject = false,
  editable = false,
}: {
  dues: DueWithProject[]
  /** Resolves the entity badges when a month bills several structures. */
  clients?: Client[]
  /** Adds a project column, for views aggregating several projects. */
  showProject?: boolean
  editable?: boolean
}) {
  if (dues.length === 0) {
    return (
      <EmptyState
        icon={IconCalendarDue}
        title="Aucune échéance"
        description="Les échéances de facturation apparaîtront ici dès qu'elles seront planifiées."
      />
    )
  }

  // Read once for the whole table, so every row is judged against the same day.
  const today = startOfToday()

  // Only one of the two layouts is ever rendered — `hidden` also keeps the
  // other out of the accessibility tree, so nothing is announced twice.
  const rows: RowProps[] = dues.map((due) => ({
    due,
    state: dueState(due, today),
    span: 1,
    showProject,
    editable,
  }))

  // Consecutive dues of one project on the same day form one group — the
  // input is sorted by date, so siblings are always adjacent. Within a group,
  // every invoice names its recipient, default entity included: leaving the
  // owner's one unlabelled would make the reader infer who it addresses.
  // Outside a group, only a due billed away from its project's client does.
  const labelFor = (entity: string) =>
    clients.find((client) => client.id === entity)?.label ?? entity

  for (let start = 0; start < rows.length;) {
    let end = start + 1

    while (
      end < rows.length &&
      rows[end].due.project.id === rows[start].due.project.id &&
      toIsoDate(rows[end].due.date) === toIsoDate(rows[start].due.date)
    ) {
      end += 1
    }

    const group = rows.slice(start, end)
    const entities = new Set(
      group.map((row) => row.due.billedTo ?? row.due.project.clientId)
    )

    for (const [position, row] of group.entries()) {
      row.span = position === 0 ? group.length : 0

      if (entities.size > 1 || row.due.billedTo) {
        row.entityLabel = labelFor(row.due.billedTo ?? row.due.project.clientId)
      }
    }

    start = end
  }

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      <ul className="divide-y md:hidden">
        {rows.map((row) => (
          <DueCard key={row.due.id} {...row} />
        ))}
      </ul>

      <Table containerClassName="hidden scroll-shadow-x md:block">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-4">Date limite</TableHead>
            <TableHead>Libellé</TableHead>
            {showProject ? <TableHead>Projet</TableHead> : null}
            <TableHead className="text-right">Montant</TableHead>
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
          {rows.map((row) => (
            <DueRow key={row.due.id} {...row} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { DuesTable }
