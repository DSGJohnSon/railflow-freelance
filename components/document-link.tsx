import Link from "next/link"
import { IconFileOff, IconFileTypePdf } from "@tabler/icons-react"

import type { Document } from "@/data/types"

/**
 * Renders a document as a link to its PDF, or as plain text when none is
 * attached yet — the icon and the missing link carry the distinction visually,
 * the sr-only note carries it for screen readers.
 */
function DocumentLink({ document }: { document: Document }) {
  if (!document.file) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <IconFileOff className="size-4 shrink-0" />
        {document.label}
        <span className="sr-only">— PDF non joint</span>
      </span>
    )
  }

  return (
    <Link
      href={document.file}
      target="_blank"
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      <IconFileTypePdf className="size-4 shrink-0 text-muted-foreground" />
      {document.label}
    </Link>
  )
}

export { DocumentLink }
