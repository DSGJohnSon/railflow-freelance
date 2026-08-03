import { IconFileText } from "@tabler/icons-react"

import type { Quote } from "@/data/types"
import {
  DeleteQuoteDialog,
  EditQuoteDialog,
} from "@/components/admin/quote-dialogs"
import { DocumentLink } from "@/components/document-link"
import { EmptyState } from "@/components/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAmount } from "@/lib/format"

function QuotesTable({
  quotes,
  projectId,
  editable = false,
}: {
  quotes: Quote[]
  projectId: string
  editable?: boolean
}) {
  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={IconFileText}
        title="Aucun devis"
        description="Aucun devis n'est rattaché à ce projet pour le moment."
      />
    )
  }

  const total = quotes.reduce((sum, quote) => sum + quote.amount, 0)

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {/* Stacked below `sm`, where the label, the amount and the two action
          buttons stop fitting on one line. Only one layout is ever rendered. */}
      <div className="sm:hidden">
        <ul className="divide-y">
          {quotes.map((quote) => (
            <li key={quote.id} className="space-y-2 p-4">
              <div className="text-sm font-medium">
                <DocumentLink document={quote} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-heading text-base tabular-nums">
                  {formatAmount(quote.amount)}
                </span>
                {editable ? (
                  <div className="flex gap-0.5">
                    <EditQuoteDialog projectId={projectId} quote={quote} />
                    <DeleteQuoteDialog projectId={projectId} quote={quote} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t bg-muted/50 p-4 text-sm">
          <span className="font-medium">Total devisé</span>
          <span className="font-heading tabular-nums">
            {formatAmount(total)}
          </span>
        </div>
      </div>

      <Table containerClassName="hidden scroll-shadow-x sm:block">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="pl-4">Devis</TableHead>
            <TableHead className={editable ? "text-right" : "pr-4 text-right"}>
              Montant
            </TableHead>
            {editable ? (
              <TableHead className="pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="max-w-md py-3 pl-4 font-medium whitespace-normal">
                <DocumentLink document={quote} />
              </TableCell>
              <TableCell
                className={
                  editable
                    ? "text-right tabular-nums"
                    : "pr-4 text-right tabular-nums"
                }
              >
                {formatAmount(quote.amount)}
              </TableCell>
              {editable ? (
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-0.5">
                    <EditQuoteDialog projectId={projectId} quote={quote} />
                    <DeleteQuoteDialog projectId={projectId} quote={quote} />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell className="pl-4">Total devisé</TableCell>
            <TableCell
              className={
                editable
                  ? "text-right tabular-nums"
                  : "pr-4 text-right tabular-nums"
              }
            >
              {formatAmount(total)}
            </TableCell>
            {editable ? <TableCell className="pr-4" /> : null}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export { QuotesTable }
