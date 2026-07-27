import type { Client, Due, DueState, Project } from "@/data/types"
import { startOfToday } from "@/lib/format"
import { readClients, readProjects } from "@/lib/store"

export type BillingSummary = {
  /** Sum of every quote attached to the scope. */
  quoted: number
  paid: number
  waiting: number
  /** Dues not invoiced yet — only counts the ones carrying an amount. */
  future: number
  /**
   * What is still to come on the contract: `quoted - paid - waiting`.
   *
   * Measured against the quotes rather than against the dues, because dues are
   * only planned as the project advances and would under-report the remainder.
   * `waiting` is subtracted so the four figures decompose the total exactly:
   * an amount already invoiced is shown under "En attente", not here.
   */
  upcoming: number
  /** Share of `quoted` already paid, 0-100. */
  progress: number
}

export type DueWithProject = Due & { project: Project }

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
 * The state a due is displayed as. Anything left unsettled once its date has
 * passed is late — whether it is still waiting on payment or was never
 * invoiced at all, both mean the schedule has slipped.
 *
 * `today` is a parameter so a whole table can be judged against a single
 * instant instead of re-reading the clock per row.
 */
export function dueState(due: Due, today: Date = startOfToday()): DueState {
  if (due.status === "PAID") {
    return "PAID"
  }

  return due.date < today ? "LATE" : due.status
}

/** Unsettled dues whose date has passed, soonest first. */
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
  const future = amountFor("FUTURE")

  return {
    quoted,
    paid,
    waiting,
    future,
    upcoming: Math.max(0, quoted - paid - waiting),
    progress: quoted === 0 ? 0 : Math.round((paid / quoted) * 100),
  }
}
