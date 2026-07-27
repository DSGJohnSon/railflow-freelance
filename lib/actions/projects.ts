"use server"

import { revalidatePath } from "next/cache"

import { EditingError, runAction, type ActionResult } from "@/lib/editing"
import { firstIssue, text } from "@/lib/form"
import { createProjectId } from "@/lib/ids"
import { projectFormSchema } from "@/lib/schemas"
import { loadClients, loadProjects, saveProjects } from "@/lib/store"
import { releaseFiles } from "@/lib/orphan-files"

function parseForm(formData: FormData) {
  const parsed = projectFormSchema.safeParse({ title: text(formData, "title") })

  if (!parsed.success) {
    throw new EditingError(firstIssue(parsed.error))
  }

  return parsed.data
}

export async function createProject(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const clientId = text(formData, "clientId")
    const { title } = parseForm(formData)

    const clients = await loadClients()

    if (!clients.some((client) => client.id === clientId)) {
      throw new EditingError("Client introuvable.")
    }

    const projects = await loadProjects()
    projects.push({ id: createProjectId(title), title, clientId })

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}

export async function updateProject(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const id = text(formData, "id")
    const { title } = parseForm(formData)

    const projects = await loadProjects()
    const project = projects.find((entry) => entry.id === id)

    if (!project) {
      throw new EditingError("Projet introuvable.")
    }

    // The id stays put: it is part of the URL the client may have bookmarked.
    project.title = title

    await saveProjects(projects)
    revalidatePath("/", "layout")
  })
}

export async function deleteProject(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const id = text(formData, "id")
    const projects = await loadProjects()
    const project = projects.find((entry) => entry.id === id)

    if (!project) {
      throw new EditingError("Projet introuvable.")
    }

    const files = [
      ...(project.quotes ?? []).map((quote) => quote.file),
      ...(project.dues ?? []).flatMap((due) =>
        due.invoice ? [due.invoice.file] : []
      ),
    ]

    const remaining = projects.filter((entry) => entry.id !== id)

    await saveProjects(remaining)
    await releaseFiles(remaining, files)

    revalidatePath("/", "layout")
  })
}
