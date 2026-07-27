import { IconPencilBolt } from "@tabler/icons-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isEditingEnabled } from "@/lib/editing"

/**
 * Reminds that edits land in the working tree and still need a commit — a
 * deployed build has a read-only filesystem and never renders this.
 */
function EditingNotice() {
  if (!isEditingEnabled()) {
    return null
  }

  return (
    <Alert>
      <IconPencilBolt />
      <AlertTitle>Édition locale active</AlertTitle>
      <AlertDescription>
        Les modifications écrivent directement dans <code>data/*.json</code> et{" "}
        <code>public/files/</code>. Pensez à commiter puis pousser pour les
        déployer.
      </AlertDescription>
    </Alert>
  )
}

export { EditingNotice }
