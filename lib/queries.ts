import type {
  Client,
  Due,
  DueState,
  DueStatus,
  Project,
  Quote,
  ServiceLine,
} from "@/data/types"
import { startOfToday } from "@/lib/format"
import { paymentDeadline } from "@/lib/payment-terms"
import { readClients, readProjects } from "@/lib/store"

export type BillingSummary = {
  /** Sum of every quote attached to the scope. */
  quoted: number
  paid: number
  waiting: number
  /** Scheduled on a dated due, not invoiced yet. */
  planned: number
  /**
   * Sold but not scheduled at all: prestations still waiting on delivery, whose
   * instalments have no dates yet. Derived from the quotes rather than from the
   * dues, because a line nobody has planned contributes no due to count.
   */
  notStarted: number
  /** Everything left to collect — `planned + notStarted`. */
  upcoming: number
  /**
   * Share of `quoted` already paid, 0-100.
   *
   * Read on its own this understates a contract whose later prestations have
   * not started: it measures the whole scope, not the part being billed. It is
   * always rendered against the full breakdown for that reason — see
   * {@link BillingBar} — and the per-line progress is what tells the real story.
   */
  progress: number
}

export type DueWithProject = Due & { project: Project }

/**
 * Where a service line stands, once its invoices are taken into account.
 *
 * `PAUSED` is what a line looks like when billing has been suspended: it has
 * started, instalments remain, and none of them is on the calendar any more.
 * Nothing records it — the shape of the schedule says it.
 */
export type LineState = "PENDING" | "BILLING" | "PAUSED" | "SETTLED"

export type LineSummary = {
  line: ServiceLine
  /** The quote the line was sold on. */
  quote: Quote
  /** The agreed total — the sum of the schedule. */
  total: number
  paid: number
  waiting: number
  planned: number
  /** Agreed but not scheduled yet: `total - paid - waiting - planned`. */
  unscheduled: number
  /** Everything still owed on the line, scheduled or not: `total - paid`. */
  outstanding: number
  /**
   * Instalments whose invoice has actually been issued. Scheduled ones are
   * left out: counting them would report a line as fully billed on the day its
   * schedule is laid down, months before the last invoice goes out.
   */
  billed: number
  /** Instalments sitting on the calendar at all — issued or merely scheduled. */
  placed: number
  /** Instalments in the plan. */
  count: number
  state: LineState
}

/** One invoice's share of a line, resolved against the line it points at. */
export type BreakdownEntry = {
  line: ServiceLine
  amount: number
  index: number
  count: number
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

/** A due only carries an amount once its invoice has been issued. */
function dueAmount(due: Due) {
  return due.invoice?.amount ?? 0
}

function byDateAsc(a: { date: Date }, b: { date: Date }) {
  return a.date.getTime() - b.date.getTime()
}

export async function getClients(): Promise<Client[]> {
  return readClients()
}

export async function getClient(clientId: string): Promise<Client | undefined> {
  const clients = await readClients()
  return clients.find((client) => client.id === clientId)
}

export async function getProjects(): Promise<Project[]> {
  return readProjects()
}

export async function getClientProjects(clientId: string): Promise<Project[]> {
  const projects = await readProjects()
  return projects.filter((project) => project.clientId === clientId)
}

export async function getProject(
  clientId: string,
  projectId: string
): Promise<Project | undefined> {
  const projects = await readProjects()
  return projects.find(
    (project) => project.clientId === clientId && project.id === projectId
  )
}

export function getDues(scope: Project[]): DueWithProject[] {
  return scope
    .flatMap((project) =>
      (project.dues ?? []).map((due) => ({ ...due, project }))
    )
    .sort(byDateAsc)
}

/** Dues still to be settled, soonest first. */
export function getUpcomingDues(scope: Project[]): DueWithProject[] {
  return getDues(scope).filter((due) => due.status !== "PAID")
}

export function getNextDue(scope: Project[]): DueWithProject | undefined {
  return getUpcomingDues(scope)[0]
}

/**
 * The state a due is displayed as. Anything left unsettled once its payment
 * term has run out is late — whether it is still waiting on payment or was
 * never invoiced at all, both mean the schedule has slipped.
 *
 * The comparison is strict, so the deadline itself is still on time: a due is
 * late on the day after, once the full term has been used up.
 *
 * `today` is a parameter so a whole table can be judged against a single
 * instant instead of re-reading the clock per row.
 */
export function dueState(due: Due, today: Date = startOfToday()): DueState {
  if (due.status === "PAID") {
    return "PAID"
  }

  return paymentDeadline(due) < today ? "LATE" : due.status
}

/** Unsettled dues whose payment term has run out, soonest first. */
export function getLateDues(scope: Project[]): DueWithProject[] {
  const today = startOfToday()

  return getDues(scope).filter((due) => dueState(due, today) === "LATE")
}

/** The last due of the schedule, whatever its status — when it all ends. */
export function getLastDue(scope: Project[]): DueWithProject | undefined {
  return getDues(scope).at(-1)
}

export function summarize(scope: Project[]): BillingSummary {
  const quoted = sum(
    scope.flatMap((project) => (project.quotes ?? []).map((q) => q.amount))
  )

  const dues = scope.flatMap((project) => project.dues ?? [])
  const amountFor = (status: Due["status"]) =>
    sum(dues.filter((due) => due.status === status).map(dueAmount))

  const paid = amountFor("PAID")
  const waiting = amountFor("WAITING")
  const planned = amountFor("FUTURE")

  return {
    quoted,
    paid,
    waiting,
    planned,
    // The four figures decompose `quoted` exactly, so whatever the schedule
    // does not account for lands here — which is precisely the money owed on
    // prestations nobody has planned yet.
    notStarted: Math.max(0, quoted - paid - waiting - planned),
    upcoming: Math.max(0, quoted - paid - waiting),
    progress: quoted === 0 ? 0 : Math.round((paid / quoted) * 100),
  }
}

/** Every invoice share of a project, grouped by the line it is charged to. */
function indexShares(project: Project) {
  const shares = new Map<string, { status: DueStatus; amount: number }[]>()

  for (const due of project.dues ?? []) {
    for (const share of due.invoice?.breakdown ?? []) {
      const entries = shares.get(share.lineId) ?? []

      entries.push({ status: due.status, amount: share.amount })
      shares.set(share.lineId, entries)
    }
  }

  return shares
}

function summarizeLine(
  line: ServiceLine,
  quote: Quote,
  shares: { status: DueStatus; amount: number }[],
  today: Date
): LineSummary {
  const amountFor = (status: DueStatus) =>
    sum(shares.filter((share) => share.status === status).map((s) => s.amount))

  const total = sum(line.schedule)
  const paid = amountFor("PAID")
  const waiting = amountFor("WAITING")
  const planned = amountFor("FUTURE")

  // Only what has left the door. A due still ahead is scheduled, not billed.
  const billed = shares.filter((share) => share.status !== "FUTURE").length
  const placed = shares.length
  const count = line.schedule.length

  // Under way once an invoice has gone out, or once the delivery date has come
  // — the schedule of a prestation planned for next year says it is sold, not
  // that it has started.
  const started =
    billed > 0 || (line.startedOn ? line.startedOn <= today : false)

  /**
   * Order matters. `started` comes first so a prestation scheduled for next
   * year still reads "à livrer" rather than "en cours". "En pause" then needs
   * instalments left to place: a line whose whole plan is on the calendar and
   * merely awaiting payment is not paused, it is simply fully invoiced.
   */
  function state(): LineState {
    if (total > 0 && paid >= total) {
      return "SETTLED"
    }

    if (!started) {
      return "PENDING"
    }

    return planned === 0 && placed < count ? "PAUSED" : "BILLING"
  }

  return {
    line,
    quote,
    total,
    paid,
    waiting,
    planned,
    unscheduled: Math.max(0, total - paid - waiting - planned),
    outstanding: Math.max(0, total - paid),
    billed,
    placed,
    count,
    state: state(),
  }
}

/**
 * Every service line of the scope with its own tally — what the client has
 * paid on it, what is scheduled, and what is still to come.
 *
 * Resolved one project at a time so a line only ever picks up shares from the
 * invoices of its own project.
 *
 * `today` is a parameter for the same reason as {@link dueState}: a whole
 * table is judged against one instant rather than re-reading the clock per row.
 */
export function summarizeLines(
  scope: Project[],
  today: Date = startOfToday()
): LineSummary[] {
  return scope.flatMap((project) => {
    const shares = indexShares(project)

    return (project.quotes ?? []).flatMap((quote) =>
      (quote.lines ?? []).map((line) =>
        summarizeLine(line, quote, shares.get(line.id) ?? [], today)
      )
    )
  })
}

/**
 * What an invoice is made of, each share resolved against its line.
 *
 * A share pointing at a line that no longer exists is dropped rather than
 * rendered as a blank row: the amount still shows in the invoice total, and a
 * deleted quote should not break the page.
 */
export function breakdownOf(due: DueWithProject): BreakdownEntry[] {
  const breakdown = due.invoice?.breakdown

  if (!breakdown?.length) {
    return []
  }

  const lines = new Map(
    (due.project.quotes ?? [])
      .flatMap((quote) => quote.lines ?? [])
      .map((line) => [line.id, line])
  )

  return breakdown.flatMap((share) => {
    const line = lines.get(share.lineId)

    return line
      ? [
          {
            line,
            amount: share.amount,
            index: share.index,
            count: line.schedule.length,
          },
        ]
      : []
  })
}

/**
 * Quotes whose lines do not add up to the amount signed, so a slip in the
 * breakdown is caught on screen instead of quietly skewing the remainder.
 */
export function lineMismatches(scope: Project[]) {
  return scope
    .flatMap((project) => project.quotes ?? [])
    .flatMap((quote) => {
      if (!quote.lines?.length) {
        return []
      }

      const lined = sum(quote.lines.map((line) => sum(line.schedule)))

      return lined === quote.amount ? [] : [{ quote, lined }]
    })
}
