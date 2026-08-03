export type Client = {
  id: string
  label: string
  adress: string
  siret?: string
  contact?: string
}

/**
 * A line of the signed quote: one prestation sold, with the instalment plan
 * agreed for it.
 *
 * It exists from the day the quote is signed, long before anything is invoiced
 * — that is the whole point. A prestation that has not been delivered yet has
 * no due of its own, so without this the money still owed for it would be
 * invisible and the remainder would read far too low.
 */
export type ServiceLine = {
  id: string
  label: string
  /**
   * The agreed instalments, one entry per month, in cents. Uneven by nature:
   * the first is usually the deposit and runs higher than the rest.
   *
   * The total of the line is the sum of this — deliberately not stored beside
   * it, so an amount and its schedule can never drift apart.
   */
  schedule: number[]
  /**
   * The month the first instalment falls in. Absent until the prestation is
   * delivered: the calendar only starts running then, so a line waiting on
   * delivery holds a plan without dates rather than dates nobody committed to.
   */
  startedOn?: Date
}

/**
 * The share of one invoice charged to one service line.
 *
 * A monthly invoice covers every prestation currently being billed, so it
 * carries several of these — this is what lets a due say what it is made of.
 */
export type InvoiceLine = {
  lineId: ServiceLine["id"]
  amount: number
  /** Rank of the instalment within the line's schedule — the "3" of "3/12". */
  index: number
}

type BaseDocument = {
  id: string
  label: string
  amount: number // In cents
  /** Public path of the PDF. Absent until the document is attached. */
  file?: string
}

/**
 * Quotes and invoices are split apart because what they carry differs: a quote
 * sells lines, an invoice charges against them. Keeping one shape with both
 * fields optional would let either be set on the wrong kind of document.
 */
export type Quote = BaseDocument & {
  type: "DEVIS"
  /** The prestations sold. Absent on a quote billed as a single block. */
  lines?: ServiceLine[]
}

export type Invoice = BaseDocument & {
  type: "FACTURE"
  /**
   * How the invoice splits across the service lines. Absent on an invoice that
   * predates the breakdown, in which case only its total is known.
   */
  breakdown?: InvoiceLine[]
}

export type Document = Quote | Invoice

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
  /** The day the invoice was issued. The payment term runs from here. */
  date: Date
  status: DueStatus
  /**
   * The day the money actually arrived. Recorded as a receipt, not as a
   * verdict: nothing derives "settled late" from it, because a due that has
   * been paid needs no chasing and the reproach would serve nobody. Absent on
   * anything unpaid, and on settled dues predating the field.
   */
  paidOn?: Date
  invoice?: Invoice
}

export type Project = {
  id: string
  title: string
  clientId: Client["id"]
  quotes?: Quote[]
  dues?: Due[]
}
