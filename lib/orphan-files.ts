import type { Project } from "@/data/types"
import { deleteUpload } from "@/lib/uploads"

/**
 * Deletes uploaded PDFs that no document points at any more.
 *
 * The reference check is not optional: several documents can legitimately
 * share one file — in the seed data a quote and an invoice both point at
 * `DEVIS_2025-0056.pdf` — so unlinking on sight would break the survivor.
 *
 * Candidates may be `undefined` since documents can exist without a PDF.
 */
export async function releaseFiles(
  projects: Project[],
  candidates: (string | undefined)[]
) {
  const referenced = new Set<string>()

  for (const project of projects) {
    for (const quote of project.quotes ?? []) {
      if (quote.file) {
        referenced.add(quote.file)
      }
    }

    for (const due of project.dues ?? []) {
      if (due.invoice?.file) {
        referenced.add(due.invoice.file)
      }
    }
  }

  for (const file of new Set(candidates)) {
    if (file && !referenced.has(file)) {
      await deleteUpload(file)
    }
  }
}
