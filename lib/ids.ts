import { randomBytes } from "node:crypto"

// Combining diacritics, as split out by NFD normalization.
const accents = /[̀-ͯ]/g

/** "Holiday Geek Cup" -> "holidaygeekcup", matching the existing ids. */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(accents, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24)
}

function randomSuffix(length: number) {
  return randomBytes(16).toString("base64url").slice(0, length)
}

export function createClientId(label: string) {
  const slug = slugify(label) || "client"
  return `${slug}-${randomSuffix(6)}`
}

/** Project ids appear in URLs, so they stay readable. */
export function createProjectId(title: string) {
  const slug = slugify(title) || "projet"
  return `${slug}-${randomSuffix(4)}`
}

export function createDocumentId() {
  return randomBytes(16).toString("base64url")
}

export const createDueId = createDocumentId
