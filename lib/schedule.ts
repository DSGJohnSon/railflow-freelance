import { formatAmountInput } from "@/lib/format"
import { amountField } from "@/lib/schemas"

/**
 * Guard against a typo like "1000x120" turning into a thousand dues. No real
 * instalment plan comes close to twenty years.
 */
const MAX_INSTALMENTS = 240

/**
 * The separator is `+`, never the comma: in French the comma is the decimal
 * mark, and splitting on it would read "1 750,50 + 2x120" as four instalments
 * of 1 750, 50 and 120 € rather than three.
 */
export const SCHEDULE_HINT =
  "Les mensualités séparées par +, « 12x120 » valant douze mensualités de 120 €. La virgule reste le séparateur décimal. Exemple : 310 + 12x120."

export type ScheduleParse =
  { ok: true; schedule: number[] } | { ok: false; error: string }

/**
 * Reads an instalment plan written the way it is said out loud — "310 + 12x120"
 * for a deposit followed by a year of monthly payments.
 *
 * Typing sixteen amounts one by one is the kind of chore that produces the
 * mistakes this whole breakdown exists to catch, so the field takes the short
 * form. Amounts go through the same parser as every other money input.
 */
export function parseSchedule(input: string): ScheduleParse {
  const schedule: number[] = []

  for (const term of input.split(/[+;]/)) {
    const trimmed = term.trim()

    if (!trimmed) {
      continue
    }

    const repeated = trimmed.match(/^(\d{1,3})\s*[x×*]\s*(.+)$/i)
    const count = repeated ? Number(repeated[1]) : 1
    const amount = amountField.safeParse(repeated ? repeated[2] : trimmed)

    if (!amount.success || count < 1) {
      return {
        ok: false,
        error: `« ${trimmed} » n'est pas une mensualité valide. Attendu : 120 ou 12x120.`,
      }
    }

    if (schedule.length + count > MAX_INSTALMENTS) {
      return {
        ok: false,
        error: `Un échéancier est limité à ${MAX_INSTALMENTS} mensualités.`,
      }
    }

    schedule.push(...Array<number>(count).fill(amount.data))
  }

  if (schedule.length === 0) {
    return { ok: false, error: "Échéancier requis. Exemple : 310 + 12x120." }
  }

  return { ok: true, schedule }
}

/** Whole euros lose the cents, so the common case reads "120" and not "120,00". */
function money(cents: number) {
  const written = formatAmountInput(cents)

  return written.endsWith(",00") ? written.slice(0, -3) : written
}

/**
 * The inverse of {@link parseSchedule}, so the edit form shows the plan in the
 * same short form it was typed in. Runs of equal amounts fold back together.
 */
export function formatSchedule(schedule: number[]) {
  const groups: { amount: number; count: number }[] = []

  for (const amount of schedule) {
    const last = groups.at(-1)

    if (last?.amount === amount) {
      last.count += 1
    } else {
      groups.push({ amount, count: 1 })
    }
  }

  return groups
    .map(({ amount, count }) =>
      count === 1 ? money(amount) : `${count}x${money(amount)}`
    )
    .join(" + ")
}
