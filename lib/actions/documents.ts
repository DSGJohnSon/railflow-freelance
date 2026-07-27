"use server"

import { revalidatePath } from "next/cache"

import type { Document, DueStatus, Project } from "@/data/types"
import { EditingError, runAction, type ActionResult } from "@/lib/editing"
import { firstIssue, text, upload } from "@/lib/form"
import { parseIsoDate } from "@/lib/format"
import { createDocumentId, createDueId } from "@/lib/ids"
import { releaseFiles } from "@/lib/orphan-files"
import { amountField, dueFormSchema, quoteFormSchema } from "@/lib/schemas"
import { loadProjects, saveProjects } from "@/lib/store"
import { savePdf } from "@/lib/uploads"

function findProject(projects: Project[], projectId: string) {
  const project = projects.find((entry) => entry.id === projectId)

  if (!project) {
    throw new EditingError("Projet introuvable.")
  }

  return project
}

export async function saveQuote(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = quoteFormSchema.safeParse({
      label: text(formData, "label"),
      amount: text(formData, "amount"),
    })

    if (!parsed.success) {
      throw new EditingError(firstIssue(parsed.error))
    }

    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const quoteId = text(formData, "quoteId")

    const quotes = project.quotes ?? []
    const existing = quoteId
      ? quotes.find((quote) => quote.id === quoteId)
      : undefined

    if (quoteId && !existing) {
      throw new EditingError("Devis introuvable.")
    }

    const pdf = upload(formData, "file")
    const previousFile = existing?.file

    // The PDF is optional: a quote can be recorded before it is drawn up.
    const file = pdf
      ? await savePdf(pdf, "quotes", parsed.data.label)
      : previousFile

    if (existing) {
      existing.label = parsed.data.label
      existing.amount = parsed.data.amount
      existing.file = file
    } else {
      quotes.push({
        id: createDocumentId(),
        label: parsed.data.label,
        amount: parsed.data.amount,
        type: "DEVIS",
        file,
      })
      project.quotes = quotes
    }

    await saveProjects(projects)

    if (previousFile && previousFile !== file) {
      await releaseFiles(projects, [previousFile])
    }

    revalidatePath("/", "layout")
  })
}

export async function deleteQuote(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const quoteId = text(formData, "quoteId")

    const quotes = project.quotes ?? []
    const quote = quotes.find((entry) => entry.id === quoteId)

    if (!quote) {
      throw new EditingError("Devis introuvable.")
    }

    project.quotes = quotes.filter((entry) => entry.id !== quoteId)

    await saveProjects(projects)
    await releaseFiles(projects, [quote.file])

    revalidatePath("/", "layout")
  })
}

/**
 * Builds the invoice attached to a due, or `undefined` when the due is only
 * planned.
 *
 * A due is WAITING or PAID *because* an invoice was issued, so those states
 * always carry one — otherwise a due could be marked paid while contributing
 * nothing to the totals, which reads as a 0 € payment. Beyond that, filling in
 * any invoice field is taken as intent to attach one, and each missing piece
 * is reported on its own rather than as a blanket "invoice required".
 *
 * Only the label and the amount are mandatory; the PDF can come later.
 */
async function resolveInvoice(
  status: DueStatus,
  fields: { label?: string; amount?: string },
  pdf: File | null,
  previous: Document | undefined
): Promise<Document | undefined> {
  const touched = Boolean(fields.label || fields.amount || pdf)

  if (status === "FUTURE" && !touched) {
    return undefined
  }

  const label = fields.label || previous?.label

  if (!label) {
    throw new EditingError("Le libellé de la facture est requis.")
  }

  let amount = previous?.amount

  if (fields.amount) {
    const parsed = amountField.safeParse(fields.amount)

    if (!parsed.success) {
      throw new EditingError(firstIssue(parsed.error))
    }

    amount = parsed.data
  }

  if (amount === undefined) {
    throw new EditingError("Le montant de la facture est requis.")
  }

  // The PDF is optional: the due can be tracked before the invoice is issued.
  const file = pdf ? await savePdf(pdf, "invoices", label) : previous?.file

  return {
    id: previous?.id ?? createDocumentId(),
    label,
    amount,
    type: "FACTURE",
    file,
  }
}

export async function saveDue(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = dueFormSchema.safeParse({
      date: text(formData, "date"),
      status: text(formData, "status"),
      invoiceLabel: text(formData, "invoiceLabel"),
      invoiceAmount: text(formData, "invoiceAmount"),
    })

    if (!parsed.success) {
      throw new EditingError(firstIssue(parsed.error))
    }

    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const dueId = text(formData, "dueId")

    const dues = project.dues ?? []
    const existing = dueId ? dues.find((due) => due.id === dueId) : undefined

    if (dueId && !existing) {
      throw new EditingError("Échéance introuvable.")
    }

    const previousFile = existing?.invoice?.file

    const invoice = await resolveInvoice(
      parsed.data.status,
      {
        label: parsed.data.invoiceLabel,
        amount: parsed.data.invoiceAmount,
      },
      upload(formData, "invoiceFile"),
      existing?.invoice
    )

    const date = parseIsoDate(parsed.data.date)

    if (existing) {
      existing.date = date
      existing.status = parsed.data.status
      existing.invoice = invoice
    } else {
      dues.push({
        id: createDueId(),
        date,
        status: parsed.data.status,
        invoice,
      })
      project.dues = dues
    }

    await saveProjects(projects)

    if (previousFile && previousFile !== invoice?.file) {
      await releaseFiles(projects, [previousFile])
    }

    revalidatePath("/", "layout")
  })
}

export async function deleteDue(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const projects = await loadProjects()
    const project = findProject(projects, text(formData, "projectId"))
    const dueId = text(formData, "dueId")

    const dues = project.dues ?? []
    const due = dues.find((entry) => entry.id === dueId)

    if (!due) {
      throw new EditingError("Échéance introuvable.")
    }

    project.dues = dues.filter((entry) => entry.id !== dueId)

    await saveProjects(projects)

    if (due.invoice) {
      await releaseFiles(projects, [due.invoice.file])
    }

    revalidatePath("/", "layout")
  })
}
