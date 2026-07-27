import { access, mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

import { EditingError } from "@/lib/editing"
import { slugify } from "@/lib/ids"

const publicDir = path.join(process.cwd(), "public")
const filesRoot = path.join(publicDir, "files")

const MAX_BYTES = 8 * 1024 * 1024

export type UploadKind = "quotes" | "invoices"

/**
 * The browser-supplied filename is never used as-is: it can contain path
 * separators, `..`, or characters that break the URL. Only this allowlist
 * survives.
 */
function safeStem(value: string) {
  const cleaned = value
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, 80)

  return cleaned || slugify(value) || "document"
}

async function exists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

/** Never overwrites: `devis.pdf` becomes `devis-2.pdf` if taken. */
async function freePath(dir: string, stem: string) {
  for (let attempt = 1; attempt < 100; attempt++) {
    const name = attempt === 1 ? `${stem}.pdf` : `${stem}-${attempt}.pdf`
    const target = path.join(dir, name)

    if (!(await exists(target))) {
      return { name, target }
    }
  }

  throw new EditingError("Trop de fichiers portent déjà ce nom.")
}

/**
 * Writes a PDF under `public/files/<kind>/` and returns its public path.
 */
export async function savePdf(
  file: File,
  kind: UploadKind,
  preferredName: string
) {
  if (file.size === 0) {
    throw new EditingError("Le fichier est vide.")
  }

  if (file.size > MAX_BYTES) {
    throw new EditingError(
      `Le PDF dépasse la limite de ${MAX_BYTES / 1024 / 1024} Mo.`
    )
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  // Checked on content rather than on the declared MIME type, which the client
  // controls.
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new EditingError("Le fichier n'est pas un PDF.")
  }

  const dir = path.join(filesRoot, kind)
  await mkdir(dir, { recursive: true })

  const { name, target } = await freePath(dir, safeStem(preferredName))
  await writeFile(target, bytes)

  return `/files/${kind}/${name}`
}

/**
 * Deletes an uploaded PDF, but only if it really sits under `public/files`.
 * Returns false when the path escapes that directory.
 */
export async function deleteUpload(publicPath: string) {
  const resolved = path.resolve(publicDir, `.${publicPath}`)

  if (!resolved.startsWith(filesRoot + path.sep)) {
    return false
  }

  try {
    await unlink(resolved)
    return true
  } catch {
    return false
  }
}
