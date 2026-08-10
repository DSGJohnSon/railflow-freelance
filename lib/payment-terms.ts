import type { Due } from "@/data/types"
import { endOfMonth } from "@/lib/format"

/**
 * Payment terms. Invoices go out on the 1st of the month and are payable
 * until the end of that same month: the deadline is the last day of the
 * issue month, whatever day the invoice was actually emitted.
 *
 * Kept out of `queries.ts` so client components can state the rule without
 * pulling the file-backed store — and its `node:fs` imports — into the bundle.
 */

/** The rule spelled out, so every page states it the same way. */
export const PAYMENT_TERM_NOTICE =
  "Chaque facture est payable jusqu'au dernier jour du mois de son émission."

/** The last day an invoice can be settled without falling behind. */
export function paymentDeadline(due: Due) {
  return endOfMonth(due.date)
}
