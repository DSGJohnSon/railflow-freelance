"use client"

import * as React from "react"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import type { Due, DueStatus } from "@/data/types"
import { Field, FormDialog } from "@/components/admin/form-dialog"
import { dueStates } from "@/components/due-state-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deleteDue, saveDue } from "@/lib/actions/documents"
import { formatAmountInput, toIsoDate } from "@/lib/format"
import { PAYMENT_TERM_DAYS } from "@/lib/payment-terms"

// "En retard" is deliberately absent: it is derived from the date, not chosen.
const statusOrder: DueStatus[] = ["FUTURE", "WAITING", "PAID"]

function StatusField({
  value,
  onValueChange,
}: {
  value: DueStatus
  onValueChange: (value: DueStatus) => void
}) {
  const id = React.useId()

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Statut</Label>
      <Select
        name="status"
        value={value}
        onValueChange={(next) => onValueChange(next as DueStatus)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOrder.map((status) => (
            <SelectItem key={status} value={status}>
              {dueStates[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DueFields({ due }: { due?: Due }) {
  // Drives the required flags below, so a missing invoice is caught in the
  // form instead of coming back as a server error.
  const [status, setStatus] = React.useState<DueStatus>(due?.status ?? "FUTURE")

  const invoiceRequired = status !== "FUTURE"
  const hasFile = Boolean(due?.invoice?.file)

  return (
    <>
      {due ? <input type="hidden" name="dueId" value={due.id} /> : null}

      <Field
        label="Date d'émission de la facture"
        name="date"
        type="date"
        defaultValue={due ? toIsoDate(due.date) : ""}
        hint={`La date limite de règlement en découle : ${PAYMENT_TERM_DAYS} jours plus tard.`}
        required
      />

      <StatusField value={status} onValueChange={setStatus} />

      {/* Only for a settled due: the field would be meaningless on anything
          still awaiting payment, and the action drops the value anyway. */}
      {status === "PAID" ? (
        <Field
          label="Réglée le"
          name="paidOn"
          type="date"
          defaultValue={due?.paidOn ? toIsoDate(due.paidOn) : ""}
          hint="Facultatif. Affiché comme un reçu — aucun retard n'en est déduit."
        />
      ) : null}

      <div className="grid gap-4 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {invoiceRequired
            ? "Une échéance en attente ou payée doit porter une facture : libellé et montant. Le PDF peut être joint plus tard."
            : "Facture facultative pour une échéance simplement planifiée."}
        </p>

        <Field
          label="Libellé de la facture"
          name="invoiceLabel"
          defaultValue={due?.invoice?.label}
          placeholder="Échéance 2/ 2025-0056"
          required={invoiceRequired}
        />
        <Field
          label="Montant facturé"
          name="invoiceAmount"
          defaultValue={
            due?.invoice ? formatAmountInput(due.invoice.amount) : ""
          }
          inputMode="decimal"
          placeholder="310,00"
          required={invoiceRequired}
        />
        <Field
          label={hasFile ? "Remplacer le PDF" : "PDF de la facture"}
          name="invoiceFile"
          type="file"
          accept="application/pdf"
          hint={
            hasFile
              ? "Facultatif — laissez vide pour conserver le fichier actuel."
              : "Facultatif, 8 Mo maximum. Vous pourrez le joindre plus tard."
          }
        />
      </div>
    </>
  )
}

function CreateDueDialog({ projectId }: { projectId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <IconPlus />
          Ajouter une échéance
        </Button>
      }
      title="Nouvelle échéance"
      submitLabel="Créer"
      action={saveDue}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <DueFields />
    </FormDialog>
  )
}

function EditDueDialog({ projectId, due }: { projectId: string; due: Due }) {
  return (
    <FormDialog
      trigger={
        <Button size="icon-xs" variant="ghost" aria-label="Modifier l'échéance">
          <IconPencil />
        </Button>
      }
      title="Modifier l'échéance"
      action={saveDue}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <DueFields due={due} />
    </FormDialog>
  )
}

function DeleteDueDialog({ projectId, due }: { projectId: string; due: Due }) {
  return (
    <FormDialog
      trigger={
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Supprimer l'échéance"
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash />
        </Button>
      }
      title="Supprimer cette échéance ?"
      description={
        due.invoice
          ? `${due.invoice.label} sera retirée. Son PDF ne sera effacé que si aucun autre document ne l'utilise.`
          : "Cette échéance sera retirée du projet."
      }
      submitLabel="Supprimer"
      variant="destructive"
      action={deleteDue}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="dueId" value={due.id} />
    </FormDialog>
  )
}

export { CreateDueDialog, EditDueDialog, DeleteDueDialog }
