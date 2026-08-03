import type { Due, InvoiceLine, Project, ServiceLine } from "@/data/types"
import { addMonths, formatMonth, toIsoDate } from "@/lib/format"
import { createDocumentId, createDueId } from "@/lib/ids"

/**
 * Moving instalments on and off the calendar, kept apart from the actions that
 * call it: this is where a client's remaining schedule is rewritten, and it
 * has to be exercisable without a running server.
 *
 * Everything here mutates the project in place — the caller loads it, applies
 * a change, and saves.
 */

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

/** Every share of a line sitting on the calendar, issued or merely planned. */
export function sharesOf(project: Project, lineId: string): InvoiceLine[] {
  return (project.dues ?? []).flatMap(
    (due) =>
      due.invoice?.breakdown?.filter((share) => share.lineId === lineId) ?? []
  )
}

/**
 * How far down the plan the calendar already goes.
 *
 * Taken from the furthest rank rather than from a count, so a gap in the
 * schedule can never make two shares claim the same instalment.
 */
export function placedCount(project: Project, lineId: string) {
  return sharesOf(project, lineId).reduce(
    (highest, share) => Math.max(highest, share.index),
    0
  )
}

/**
 * Takes a line off the calendar wherever nothing has gone out yet.
 *
 * An invoice already issued is a document the client holds and keeps its
 * total, so only planned instalments are pulled. A slot left with nothing to
 * charge and no PDF disappears with them — it only ever existed to carry them.
 */
export function unschedule(project: Project, lineId: string) {
  project.dues = (project.dues ?? []).flatMap((due): Due[] => {
    const invoice = due.invoice

    if (due.status !== "FUTURE" || !invoice?.breakdown) {
      return [due]
    }

    const kept = invoice.breakdown.filter((share) => share.lineId !== lineId)

    if (kept.length === invoice.breakdown.length) {
      return [due]
    }

    if (kept.length === 0 && !invoice.file) {
      return []
    }

    due.invoice = {
      ...invoice,
      breakdown: kept,
      amount: sum(kept.map((share) => share.amount)),
    }

    return [due]
  })
}

/**
 * Lays the instalments a line still owes onto the calendar, one a month from
 * `from`.
 *
 * Serves both the first delivery and every resumption after a pause: it picks
 * up where the plan left off, which is what lets billing be suspended and
 * taken up again without the client's remaining balance ever moving.
 *
 * A month already planned takes the instalment into its own invoice rather
 * than opening a second one — a month billing three prestations stays one
 * invoice. A month whose invoice has gone out is left alone and gets a due of
 * its own, because its total has to keep matching the paper the client holds.
 */
export function placeInstalments(
  project: Project,
  line: ServiceLine,
  from: Date
) {
  const placed = placedCount(project, line.id)
  const remaining = line.schedule.slice(placed)
  const dues = project.dues ?? []

  remaining.forEach((amount, position) => {
    const date = addMonths(from, position)
    const share: InvoiceLine = {
      lineId: line.id,
      amount,
      index: placed + position + 1,
    }

    const slot = dues.find(
      (due) =>
        due.status === "FUTURE" && toIsoDate(due.date) === toIsoDate(date)
    )

    if (slot?.invoice) {
      slot.invoice.breakdown = [...(slot.invoice.breakdown ?? []), share]
      slot.invoice.amount += amount
      return
    }

    const invoice = {
      id: createDocumentId(),
      // No number yet: an invoice is numbered when it is issued, so a slot
      // still ahead carries the month it covers.
      label: `Facture — ${formatMonth(date)}`,
      amount,
      type: "FACTURE" as const,
      breakdown: [share],
    }

    if (slot) {
      slot.invoice = invoice
      return
    }

    dues.push({ id: createDueId(), date, status: "FUTURE", invoice })
  })

  // Only ever set once: it records when the prestation went live, and a
  // resumption after a pause does not rewrite that history.
  line.startedOn ??= from
  project.dues = dues.sort((a, b) => a.date.getTime() - b.date.getTime())

  return remaining.length
}
