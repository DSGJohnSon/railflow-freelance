import type { ZodError } from "zod"

/** FormData entries are `string | File | null`; forms only want the strings. */
export function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

/** Returns the uploaded file only when one was actually chosen. */
export function upload(formData: FormData, key: string) {
  const value = formData.get(key)
  return value instanceof File && value.size > 0 ? value : null
}

export function firstIssue(error: ZodError) {
  return error.issues[0]?.message ?? "Données invalides."
}
