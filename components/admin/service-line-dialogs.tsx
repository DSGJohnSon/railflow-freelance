"use client"

import * as React from "react"
import {
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import type { Client, Quote, ServiceLine } from "@/data/types"
import { Field, FormDialog } from "@/components/admin/form-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  deleteServiceLine,
  pauseServiceLine,
  saveServiceLine,
  startServiceLine,
} from "@/lib/actions/service-lines"
import { formatAmount } from "@/lib/format"
import { formatSchedule, SCHEDULE_HINT } from "@/lib/schedule"

function QuoteField({ quotes }: { quotes: Quote[] }) {
  const id = React.useId()
  const [value, setValue] = React.useState(quotes[0]?.id ?? "")

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Devis</Label>
      <Select
        name="quoteId"
        value={value}
        onValueChange={(next) => setValue(next ?? "")}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {quotes.map((quote) => (
            <SelectItem key={quote.id} value={quote.id}>
              {quote.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Le devis qui vend cette prestation. Le total de ses postes doit retomber
        sur son montant.
      </p>
    </div>
  )
}

/**
 * Who the line's invoices are addressed to. Defaults to the project's client,
 * which is the right answer for every project billed to a single entity — the
 * field only matters when a client pays through several structures.
 */
function BilledToField({
  clients,
  projectClientId,
  line,
}: {
  clients: Client[]
  projectClientId: string
  line?: ServiceLine
}) {
  const id = React.useId()
  const [value, setValue] = React.useState(line?.billedTo ?? projectClientId)

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Facturé à</Label>
      <Select
        name="billedTo"
        value={value}
        onValueChange={(next) => setValue(next ?? projectClientId)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        L&apos;entité juridique destinataire des factures de ce poste. Chaque
        mois produit une facture par entité.
      </p>
    </div>
  )
}

function ScheduleField({ line }: { line?: ServiceLine }) {
  return (
    <Field
      label="Échéancier"
      name="schedule"
      defaultValue={line ? formatSchedule(line.schedule) : ""}
      placeholder="310 + 12x120"
      required
      hint={SCHEDULE_HINT}
    />
  )
}

function CreateServiceLineDialog({
  projectId,
  quotes,
  clients,
  projectClientId,
}: {
  projectId: string
  quotes: Quote[]
  clients: Client[]
  projectClientId: string
}) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline" disabled={quotes.length === 0}>
          <IconPlus />
          Ajouter un poste
        </Button>
      }
      title="Nouveau poste"
      description="Une prestation vendue par le devis, avec le découpage en mensualités convenu pour elle."
      submitLabel="Créer"
      action={saveServiceLine}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <QuoteField quotes={quotes} />
      <Field
        label="Libellé"
        name="label"
        placeholder="Site vitrine"
        required
        autoFocus
      />
      <ScheduleField />
      <BilledToField clients={clients} projectClientId={projectClientId} />
    </FormDialog>
  )
}

function EditServiceLineDialog({
  projectId,
  line,
  clients,
  projectClientId,
}: {
  projectId: string
  line: ServiceLine
  clients: Client[]
  projectClientId: string
}) {
  return (
    <FormDialog
      trigger={
        <Button size="icon-xs" variant="ghost" aria-label="Modifier le poste">
          <IconPencil />
        </Button>
      }
      title="Modifier le poste"
      description="Les factures déjà émises ne bougent pas : seul ce qui reste à devoir est recalculé. Pour changer l'entité facturée, mettez d'abord la facturation en pause."
      action={saveServiceLine}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lineId" value={line.id} />
      <Field label="Libellé" name="label" defaultValue={line.label} required />
      <ScheduleField line={line} />
      <BilledToField
        clients={clients}
        projectClientId={projectClientId}
        line={line}
      />
    </FormDialog>
  )
}

/**
 * Puts a prestation into service, and takes it up again after a pause: the one
 * action that turns a plan into dated échéances, instead of adding them one at
 * a time.
 *
 * Only what is left to place is concerned, so the wording changes with it —
 * "mettre en service" the first time, "reprendre" afterwards.
 */
function StartServiceLineDialog({
  projectId,
  line,
  remaining,
}: {
  projectId: string
  line: ServiceLine
  /** Instalments not yet on the calendar. */
  remaining: number
}) {
  const resuming = remaining < line.schedule.length
  const label = resuming ? "Reprendre la facturation" : "Mettre en service"
  const amount = formatAmount(
    line.schedule
      .slice(line.schedule.length - remaining)
      .reduce((a, b) => a + b, 0)
  )

  return (
    <FormDialog
      trigger={
        <Button size="icon-xs" variant="ghost" aria-label={label}>
          <IconPlayerPlay />
        </Button>
      }
      title={label}
      description={`Les ${remaining} mensualités restantes de « ${line.label} » — ${amount} — sont placées sur l'échéancier, une par mois. Un mois déjà planifié voit la mensualité s'ajouter à sa facture ; les autres reçoivent une nouvelle échéance.`}
      submitLabel={resuming ? "Reprendre" : "Mettre en service"}
      action={startServiceLine}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lineId" value={line.id} />
      <Field
        label={
          resuming
            ? "Date de la prochaine mensualité"
            : "Date de la première mensualité"
        }
        name="startedOn"
        type="date"
        required
        autoFocus
        hint="Les suivantes tombent de mois en mois à partir de cette date. Aucune facture déjà émise n'est modifiée."
      />
    </FormDialog>
  )
}

/**
 * Suspends billing without touching the plan — for a client who needs to stop
 * for a while, and a resumption date nobody can name yet.
 */
function PauseServiceLineDialog({
  projectId,
  line,
  planned,
}: {
  projectId: string
  line: ServiceLine
  /** Amount currently sitting on the calendar, about to leave it. */
  planned: number
}) {
  return (
    <FormDialog
      trigger={
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Mettre la facturation en pause"
        >
          <IconPlayerPause />
        </Button>
      }
      title="Mettre la facturation en pause"
      description={`Les mensualités à venir de « ${line.label} » — ${formatAmount(planned)} — quittent l'échéancier et repassent en « non démarré ». Le montant dû par le client ne change pas, et les factures déjà émises restent intactes. Vous pourrez reprendre à la date de votre choix.`}
      submitLabel="Mettre en pause"
      action={pauseServiceLine}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lineId" value={line.id} />
    </FormDialog>
  )
}

function DeleteServiceLineDialog({
  projectId,
  line,
}: {
  projectId: string
  line: ServiceLine
}) {
  return (
    <FormDialog
      trigger={
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Supprimer le poste"
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash />
        </Button>
      }
      title="Supprimer ce poste ?"
      description={`« ${line.label} » sera retiré du devis, et ses mensualités seront enlevées des échéances non encore facturées. Les factures déjà émises restent inchangées.`}
      submitLabel="Supprimer"
      variant="destructive"
      action={deleteServiceLine}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lineId" value={line.id} />
    </FormDialog>
  )
}

export {
  CreateServiceLineDialog,
  EditServiceLineDialog,
  StartServiceLineDialog,
  PauseServiceLineDialog,
  DeleteServiceLineDialog,
}
