import { isAdmin } from "@/lib/auth"

export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Editing writes into the repository working tree, which only exists on the
 * machine running `npm run dev`. A deployed build has a read-only filesystem,
 * so the whole feature is switched off there — the UI is not rendered and the
 * actions refuse before touching anything.
 */
export function isEditingEnabled() {
  return process.env.NODE_ENV === "development"
}

export class EditingError extends Error {}

export async function assertCanEdit() {
  if (!isEditingEnabled()) {
    throw new EditingError(
      "L'édition n'est disponible qu'en local, via npm run dev."
    )
  }

  if (!(await isAdmin())) {
    throw new EditingError(
      "Session administrateur requise. Connectez-vous sur /login."
    )
  }
}

/** Turns a thrown error into the result shape the dialogs render. */
export async function runAction(
  work: () => Promise<void>
): Promise<ActionResult> {
  try {
    await assertCanEdit()
    await work()
    return { ok: true }
  } catch (error) {
    if (error instanceof EditingError) {
      return { ok: false, error: error.message }
    }

    console.error(error)

    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Une erreur est survenue.",
    }
  }
}
