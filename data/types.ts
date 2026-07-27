export type Client = {
  id: string
  label: string
  adress: string
  siret?: string
  contact?: string
}

export type Document = {
  id: string
  label: string
  amount: number // In cents
  type: "DEVIS" | "FACTURE"
  /** Public path of the PDF. Absent until the document is attached. */
  file?: string
}

/** What is recorded on disk and picked in the forms. */
export type DueStatus = "FUTURE" | "WAITING" | "PAID"

/**
 * What a due is shown as. `LATE` is derived from the date at render time
 * rather than stored: an unsettled due falls behind on its own, and nobody
 * has to remember to flip a field for it to show up.
 */
export type DueState = DueStatus | "LATE"

export type Due = {
  id: string
  date: Date
  status: DueStatus
  invoice?: Document
}

export type Project = {
  id: string
  title: string
  clientId: Client["id"]
  quotes?: Document[]
  dues?: Due[]
}
