const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
})

const longDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

/** Amounts are stored in cents. */
export function formatAmount(cents: number) {
  return currencyFormatter.format(cents / 100)
}

/** Cents -> "1750,50", the shape the amount inputs expect back. */
export function formatAmountInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",")
}

export function formatDate(date: Date) {
  return longDateFormatter.format(date)
}

export function formatShortDate(date: Date) {
  return shortDateFormatter.format(date)
}

/**
 * `2026-01-02`, for <time dateTime> and for storage.
 *
 * Built from the local calendar fields on purpose: `toISOString()` converts to
 * UTC first, which shifts the day backwards for any negative-offset timezone.
 */
export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Inverse of {@link toIsoDate}. `new Date("2026-01-02")` would parse as UTC
 * midnight and could render as the 1st, so the fields are passed separately to
 * land on local midnight.
 */
export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)

  return new Date(year, month - 1, day)
}

/**
 * Local midnight. Due dates carry no time of day, so anything comparing
 * against "now" has to round down to the day or a due would read as late
 * from the moment it opens.
 */
export function startOfToday() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** `plural(2, "devis", "devis")` -> "2 devis" */
export function plural(count: number, singular: string, many: string) {
  return `${count} ${count > 1 ? many : singular}`
}

export function initials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

/** Left in lower case when they are not the first word of the address. */
const particles = new Set([
  "au",
  "aux",
  "de",
  "des",
  "du",
  "et",
  "la",
  "le",
  "les",
  "sous",
  "sur",
])

function capitalize(word: string) {
  return word.replace(/(^|[-'])([a-zà-ÿ])/g, (_, prefix: string, letter) => {
    return prefix + (letter as string).toLocaleUpperCase("fr-FR")
  })
}

/** Turns "84 RUE PAUL BERT 62300 LENS FR" into "84 Rue Paul Bert, 62300 Lens". */
export function formatAddress(adress: string) {
  const withoutCountry = adress.replace(/\s+FR$/i, "").trim()
  const postalCode = withoutCountry.match(/\b\d{5}\b/)?.[0]

  const titleCased = withoutCountry
    .toLocaleLowerCase("fr-FR")
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && particles.has(word) ? word : capitalize(word)
    )
    .join(" ")

  if (!postalCode) {
    return titleCased
  }

  // The postal code opens the locality: "… Bert 62300 Lens" -> "… Bert, 62300 Lens".
  return titleCased.replace(new RegExp(`\\s*${postalCode}`), `, ${postalCode}`)
}
