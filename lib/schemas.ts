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

export const documentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amount: z.number().int().nonnegative(),
  type: z.enum(["DEVIS", "FACTURE"]),
  file: z.string().min(1).optional(),
})

/** Shape as stored on disk: dates are ISO strings, not `Date`. */
export const storedDueSchema = z.object({
  id: z.string().min(1),
  date: isoDate,
  status: z.enum(["FUTURE", "WAITING", "PAID"]),
  invoice: documentSchema.optional(),
})

export const storedProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientId: z.string().min(1),
  quotes: z.array(documentSchema).optional(),
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
  invoiceLabel: optionalText,
  invoiceAmount: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
})
