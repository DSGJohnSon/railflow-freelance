"use server"

import { revalidatePath } from "next/cache"

import type { Project, ServiceLine } from "@/data/types"
import { EditingError, runAction, type ActionResult } from "@/lib/editing"
import { text } from "@/lib/form"
import { parseIsoDate } from "@/lib/format"
import { createDocumentId } from "@/lib/ids"
import { parseSchedule } from "@/lib/schedule"
import { placeInstalments, unschedule } from "@/lib/scheduling"
import { loadClients, loadProjects, saveProjects } from "@/lib/store"

function findProject(projects: Project[], projectId: string) {
  const project = projects.find((entry) => entry.id === projectId)

  if (!project) {
    throw new EditingError("Projet introuvable.")
  }

  return project
}

function allLines(project: Project) {
  return (project.quotes ?? []).flatMap((quote) => quote.lines ?? [])
}

function findLine(project: Project, lineId: string) {
  const line = allLines(project).find((entry) => entry.id === lineId)

  if (!line) {
    throw new EditingError("Poste introuvable.")
  }

  return line
}

/**
 * The billing entity picked in the form, reduced to its canonical form: the
 * project's client is the default and is never stored, so a poste only ever
 * carries `billedTo` when it points somewhere else.
 */
async function resolveBilledTo(formData: FormData, project: Project) {
  const billedTo = text(formData, "billedTo")

  if (!billedTo || billedTo === project.clientId) {
    return undefined
  }

  const clients = await loadClients()

  if (!clients.some((client) => client.id === billedTo)) {
    throw new EditingError("Entité de facturation introuvable.")
  }

  return billedTo
}

/** Whether the line still has planned instalments sitting on the calendar. */
function hasPlannedShares(project: Project, lineId: string) {
  return (project.dues ?? []).some(
    (due) =>
      due.status === "FUTURE" &&
      due.invoice?.breakdown?.some((share) => share.lineId === lineId)
  )
}

export async function saveServiceLine(
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const label = text(formData, "label")

    if (!label) {
      throw new EditingError("Le libellé du poste est requis.")
    }

    const parsed = parseSchedule(text(formData, "schedule"))

    if (!parsed.ok) {
      throw new EditingError(parsed.error)
    }

    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const lineId = text(formData, "lineId")
    const billedTo = await resolveBilledTo(formData, project)

    if (lineId) {
      const line = findLine(project, lineId)

      // The planned dues carry the old entity, and silently reshuffling them
      // would rewrite dates behind the user's back — so the flow is explicit:
      // pause, change the entity, resume.
      if (line.billedTo !== billedTo && hasPlannedShares(project, lineId)) {
        throw new EditingError(
          "Mettez d'abord la facturation en pause : les mensualités planifiées de ce poste sont rattachées à l'ancienne entité."
        )
      }

      // The already-issued invoices are left alone: rewriting the plan changes
      // what is still owed, never what a client has already been charged.
      line.label = label
      line.schedule = parsed.schedule
      line.billedTo = billedTo
    } else {
      const quoteId = text(formData, "quoteId")
      const quote = (project.quotes ?? []).find((entry) => entry.id === quoteId)

      if (!quote) {
        throw new EditingError("Devis introuvable.")
      }

      const line: ServiceLine = {
        id: createDocumentId(),
        label,
        schedule: parsed.schedule,
        billedTo,
      }

      quote.lines = [...(quote.lines ?? []), line]
    }

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}

/**
 * Puts a prestation into service, and takes it up again after a pause — see
 * {@link placeInstalments} for what lands where.
 */
export async function startServiceLine(
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const startedOn = text(formData, "startedOn")

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) {
      throw new EditingError("Date de mise en service requise.")
    }

    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const lineId = text(formData, "lineId")
    const line = findLine(project, lineId)

    // Resolved here rather than in the scheduler, which is kept free of I/O.
    const entityLabel = line.billedTo
      ? (await loadClients()).find((client) => client.id === line.billedTo)
          ?.label
      : undefined

    const placed = placeInstalments(
      project,
      line,
      parseIsoDate(startedOn),
      entityLabel
    )

    if (placed === 0) {
      throw new EditingError(
        "Toutes les mensualités de ce poste sont déjà placées sur l'échéancier."
      )
    }

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}

/**
 * Suspends billing on a line: its planned instalments leave the calendar and
 * the money owed on them moves back to "non démarré", where it stays visible
 * without a date nobody has agreed to.
 *
 * The plan itself is untouched, so resuming later picks up at the right rank
 * and the client's total never moves.
 */
export async function pauseServiceLine(
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const lineId = text(formData, "lineId")

    findLine(project, lineId)
    unschedule(project, lineId)

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}

/**
 * Drops a line and unwinds whatever it had scheduled — but only where nothing
 * has gone out yet, for the same reason as above.
 */
export async function deleteServiceLine(
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const lineId = text(formData, "lineId")

    findLine(project, lineId)

    for (const quote of project.quotes ?? []) {
      quote.lines = quote.lines?.filter((line) => line.id !== lineId)
    }

    unschedule(project, lineId)

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}
