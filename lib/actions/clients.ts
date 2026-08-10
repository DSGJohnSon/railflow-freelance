"use server"

import { revalidatePath } from "next/cache"

import { EditingError, runAction, type ActionResult } from "@/lib/editing"
import { firstIssue, text } from "@/lib/form"
import { createClientId } from "@/lib/ids"
import { clientFormSchema } from "@/lib/schemas"
import { loadClients, loadProjects, saveClients } from "@/lib/store"

function parseForm(formData: FormData) {
  const parsed = clientFormSchema.safeParse({
    label: text(formData, "label"),
    adress: text(formData, "adress"),
    siret: text(formData, "siret"),
    contact: text(formData, "contact"),
  })

  if (!parsed.success) {
    throw new EditingError(firstIssue(parsed.error))
  }

  return parsed.data
}

export async function createClient(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const fields = parseForm(formData)
    const clients = await loadClients()

    clients.push({ id: createClientId(fields.label), ...fields })

    await saveClients(clients)
    revalidatePath("/", "layout")
  })
}

export async function updateClient(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const id = text(formData, "id")
    const fields = parseForm(formData)
    const clients = await loadClients()
    const client = clients.find((entry) => entry.id === id)

    if (!client) {
      throw new EditingError("Client introuvable.")
    }

    Object.assign(client, fields)

    await saveClients(clients)
    revalidatePath("/", "layout")
  })
}

export async function deleteClient(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const id = text(formData, "id")

    // Deleting the projects too would silently destroy their quotes, invoices
    // and dues, so the cascade is left as an explicit decision.
    const projects = await loadProjects()
    const owned = projects.filter((project) => project.clientId === id)

    if (owned.length > 0) {
      throw new EditingError(
        `Ce client a encore ${owned.length} projet(s). Supprimez-les d'abord.`
      )
    }

    // A client can also be the billing entity of another client's postes and
    // échéances — deleting it would leave those pointing at nobody.
    const referenced = projects.some(
      (project) =>
        (project.quotes ?? []).some((quote) =>
          (quote.lines ?? []).some((line) => line.billedTo === id)
        ) || (project.dues ?? []).some((due) => due.billedTo === id)
    )

    if (referenced) {
      throw new EditingError(
        "Ce client est encore l'entité de facturation de postes ou d'échéances d'un autre client. Réaffectez-les d'abord."
      )
    }

    const clients = await loadClients()
    const remaining = clients.filter((client) => client.id !== id)

    if (remaining.length === clients.length) {
      throw new EditingError("Client introuvable.")
    }

    await saveClients(remaining)
    revalidatePath("/", "layout")
  })
}
