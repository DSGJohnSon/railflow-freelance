import type { Due } from "@/data/types"
import { addDays } from "@/lib/format"

/**
 * Payment terms, in days. A due date is the day the invoice is issued, not the
 * day the money is expected: the client has this long to settle it.
 *
 * Kept out of `queries.ts` so client components can state the rule without
 * pulling the file-backed store — and its `node:fs` imports — into the bundle.
 */
export const PAYMENT_TERM_DAYS = 30

/** The rule spelled out, so every page states it the same way. */
export const PAYMENT_TERM_NOTICE = `Chaque facture est payable sous ${PAYMENT_TERM_DAYS} jours à compter de son émission.`

/** The last day an invoice can be settled without falling behind. */
export function paymentDeadline(due: Due) {
  return addDays(due.date, PAYMENT_TERM_DAYS)
}
