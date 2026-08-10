import { z } from "zod"

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")

export const clientSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  adress: z.string().min(1),
  siret: z.string().optional(),
  contact: z.string().optional(),
})

const baseDocumentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().int().nonnegative(),
  file: z.string().min(1).optional(),
})

/** Shape as stored on disk: dates are ISO strings, not `Date`. */
const storedServiceLineSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  schedule: z.array(z.number().int().nonnegative()).min(1),
  startedOn: isoDate.optional(),
  billedTo: z.string().min(1).optional(),
})

const invoiceLineSchema = z.object({
  lineId: z.string().min(1),
  amount: z.number().int().nonnegative(),
  index: z.number().int().positive(),
})

export const storedQuoteSchema = baseDocumentSchema.extend({
  type: z.literal("DEVIS"),
  lines: z.array(storedServiceLineSchema).optional(),
})

export const invoiceSchema = baseDocumentSchema.extend({
  type: z.literal("FACTURE"),
  breakdown: z.array(invoiceLineSchema).optional(),
})

export const storedDueSchema = z.object({
  id: z.string().min(1),
  date: isoDate,
  status: z.enum(["FUTURE", "WAITING", "PAID"]),
  paidOn: isoDate.optional(),
  invoice: invoiceSchema.optional(),
  billedTo: z.string().min(1).optional(),
})

export const storedProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientId: z.string().min(1),
  quotes: z.array(storedQuoteSchema).optional(),
  dues: z.array(storedDueSchema).optional(),
})

export const clientsFileSchema = z.array(clientSchema)
export const projectsFileSchema = z.array(storedProjectSchema)

export type StoredProject = z.infer<typeof storedProjectSchema>

/**
 * "1 750,50" -> 175050. Parsed digit by digit rather than through
 * `Number(x) * 100`, which loses cents on values like 1750.55.
 */
export const amountField = z
  .string()
  .trim()
  .min(1, "Montant requis")
  .transform((value) => value.replace(/[\s ]/g, "").replace(",", "."))
  .refine(
    (value) => /^\d+(\.\d{1,2})?$/.test(value),
    "Montant invalide (ex. 1750,50)"
  )
  .transform((value) => {
    const [whole, fraction = ""] = value.split(".")
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2))
  })

const requiredText = (label: string) => z.string().trim().min(1, label)
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional()

export const clientFormSchema = z.object({
  label: requiredText("La raison sociale est requise"),
  adress: requiredText("L'adresse est requise"),
  siret: optionalText,
  contact: optionalText,
})

export const projectFormSchema = z.object({
  title: requiredText("Le titre est requis"),
})

export const quoteFormSchema = z.object({
  label: requiredText("Le libellé est requis"),
  amount: amountField,
})

export const dueFormSchema = z.object({
  date: isoDate,
  status: z.enum(["FUTURE", "WAITING", "PAID"]),
  // Optional on purpose: dues settled before the field existed carry no date,
  // and requiring one would block editing them until it is dug up.
  paidOn: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .optional()
    .refine(
      (value) => value === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Date de règlement attendue au format AAAA-MM-JJ"
    ),
  invoiceLabel: optionalText,
  invoiceAmount: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
})
