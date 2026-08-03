import Link from "next/link"
import { IconCalendarDue } from "@tabler/icons-react"

import type { DueState } from "@/data/types"
import { DeleteDueDialog, EditDueDialog } from "@/components/admin/due-dialogs"
import { DocumentLink } from "@/components/document-link"
import { DueStateBadge } from "@/components/due-state-badge"
import { EmptyState } from "@/components/empty-state"
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
  clientId: string
  state: DueState
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

function InvoiceLabel({ due }: { due: DueWithProject }) {
  if (!due.invoice) {
    return <span className="text-muted-foreground">Facture non émise</span>
  }

  return (
    <>
      <DocumentLink document={due.invoice} />
      <InvoiceBreakdown due={due} />
    </>
  )
}

function ProjectLink({
  due,
  clientId,
  className,
}: {
  due: DueWithProject
  clientId: string
  className?: string
}) {
  return (
    <Link
      href={`/clients/${clientId}/projects/${due.project.id}`}
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
function DueRow({ due, clientId, state, showProject, editable }: RowProps) {
  const late = state === "LATE"

  return (
    <TableRow
      className={cn(
        late &&
          "bg-red-500/4 hover:bg-red-500/8 dark:bg-red-400/4 dark:hover:bg-red-400/8"
      )}
    >
      <TableCell className="pl-4 align-top">
        <DueDate due={due} late={late} />
      </TableCell>

      {/* Every cell aligns to the top: the breakdown makes the label cell the
          tallest, and vertically centred amounts would drift away from the
          invoice they belong to. */}
      <TableCell className="max-w-88 align-top font-medium whitespace-normal">
        <InvoiceLabel due={due} />
      </TableCell>

      {showProject ? (
        <TableCell className="align-top">
          <ProjectLink due={due} clientId={clientId} />
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
function DueCard({ due, clientId, state, showProject, editable }: RowProps) {
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
        <InvoiceLabel due={due} />
      </div>

      {showProject ? (
        <ProjectLink due={due} clientId={clientId} className="block text-sm" />
      ) : null}

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
  clientId,
  showProject = false,
  editable = false,
}: {
  dues: DueWithProject[]
  clientId: string
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
  const rows = dues.map((due) => ({
    due,
    clientId,
    state: dueState(due, today),
    showProject,
    editable,
  }))

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
