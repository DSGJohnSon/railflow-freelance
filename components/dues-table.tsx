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
import { dueState, type DueWithProject } from "@/lib/queries"
import { cn } from "@/lib/utils"

type RowProps = {
  due: DueWithProject
  clientId: string
  state: DueState
  showProject: boolean
  editable: boolean
}

function InvoiceLabel({ due }: { due: DueWithProject }) {
  return due.invoice ? (
    <DocumentLink document={due.invoice} />
  ) : (
    <span className="text-muted-foreground">Facture non émise</span>
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
      <TableCell
        className={cn(
          "pl-4 tabular-nums",
          late
            ? "font-medium text-red-700 dark:text-red-400"
            : "text-muted-foreground"
        )}
      >
        <time dateTime={toIsoDate(due.date)}>{formatShortDate(due.date)}</time>
      </TableCell>

      <TableCell className="max-w-88 font-medium whitespace-normal">
        <InvoiceLabel due={due} />
      </TableCell>

      {showProject ? (
        <TableCell>
          <ProjectLink due={due} clientId={clientId} />
        </TableCell>
      ) : null}

      <TableCell className="text-right tabular-nums">
        {due.invoice ? formatAmount(due.invoice.amount) : "—"}
      </TableCell>

      <TableCell className={editable ? "" : "pr-4"}>
        <div className="flex justify-end">
          <DueStateBadge state={state} />
        </div>
      </TableCell>

      {editable ? (
        <TableCell className="pr-4">
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
      <div className="flex items-start justify-between gap-3">
        <time
          dateTime={toIsoDate(due.date)}
          className={cn(
            "text-sm tabular-nums",
            late
              ? "font-medium text-red-700 dark:text-red-400"
              : "text-muted-foreground"
          )}
        >
          {formatShortDate(due.date)}
        </time>
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
            <TableHead className="pl-4">Date</TableHead>
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
