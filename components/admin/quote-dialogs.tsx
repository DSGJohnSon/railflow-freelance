"use client"

import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import type { Document } from "@/data/types"
import { Field, FormDialog } from "@/components/admin/form-dialog"
import { Button } from "@/components/ui/button"
import { deleteQuote, saveQuote } from "@/lib/actions/documents"
import { formatAmountInput } from "@/lib/format"

function QuoteFields({ quote }: { quote?: Document }) {
  return (
    <>
      {quote ? <input type="hidden" name="quoteId" value={quote.id} /> : null}
      <Field
        label="Libellé"
        name="label"
        defaultValue={quote?.label}
        required
        autoFocus
      />
      <Field
        label="Montant"
        name="amount"
        defaultValue={quote ? formatAmountInput(quote.amount) : ""}
        required
        inputMode="decimal"
        placeholder="1750,00"
        hint="En euros TTC. La virgule et le point sont acceptés."
      />
      <Field
        label={quote?.file ? "Remplacer le PDF" : "PDF du devis"}
        name="file"
        type="file"
        accept="application/pdf"
        hint={
          quote?.file
            ? "Facultatif — laissez vide pour conserver le fichier actuel."
            : "Facultatif, 8 Mo maximum. Vous pourrez le joindre plus tard."
        }
      />
    </>
  )
}

function CreateQuoteDialog({ projectId }: { projectId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <IconPlus />
          Ajouter un devis
        </Button>
      }
      title="Nouveau devis"
      submitLabel="Créer"
      action={saveQuote}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <QuoteFields />
    </FormDialog>
  )
}

function EditQuoteDialog({
  projectId,
  quote,
}: {
  projectId: string
  quote: Document
}) {
  return (
    <FormDialog
      trigger={
        <Button size="icon-xs" variant="ghost" aria-label="Modifier le devis">
          <IconPencil />
        </Button>
      }
      title="Modifier le devis"
      action={saveQuote}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <QuoteFields quote={quote} />
    </FormDialog>
  )
}

function DeleteQuoteDialog({
  projectId,
  quote,
}: {
  projectId: string
  quote: Document
}) {
  return (
    <FormDialog
      trigger={
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Supprimer le devis"
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash />
        </Button>
      }
      title="Supprimer ce devis ?"
      description={`${quote.label} sera retiré du projet. Son PDF ne sera effacé que si aucun autre document ne l'utilise.`}
      submitLabel="Supprimer"
      variant="destructive"
      action={deleteQuote}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="quoteId" value={quote.id} />
    </FormDialog>
  )
}

export { CreateQuoteDialog, EditQuoteDialog, DeleteQuoteDialog }
