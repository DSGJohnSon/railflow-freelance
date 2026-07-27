"use client"

import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import type { Client } from "@/data/types"
import { Field, FormDialog } from "@/components/admin/form-dialog"
import { Button } from "@/components/ui/button"
import { createClient, deleteClient, updateClient } from "@/lib/actions/clients"

function ClientFields({ client }: { client?: Client }) {
  return (
    <>
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <Field
        label="Raison sociale"
        name="label"
        defaultValue={client?.label}
        required
        autoFocus
      />
      <Field label="Contact" name="contact" defaultValue={client?.contact} />
      <Field
        label="Adresse"
        name="adress"
        defaultValue={client?.adress}
        required
        hint="Format libre, affiché tel quel après mise en forme."
      />
      <Field label="SIRET" name="siret" defaultValue={client?.siret} />
    </>
  )
}

function CreateClientDialog() {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <IconPlus />
          Ajouter un client
        </Button>
      }
      title="Nouveau client"
      description="L'identifiant et l'URL privée sont générés automatiquement."
      submitLabel="Créer"
      action={createClient}
    >
      <ClientFields />
    </FormDialog>
  )
}

function EditClientDialog({ client }: { client: Client }) {
  return (
    <FormDialog
      trigger={
        <Button size="icon-sm" variant="ghost" aria-label="Modifier le client">
          <IconPencil />
        </Button>
      }
      title="Modifier le client"
      action={updateClient}
    >
      <ClientFields client={client} />
    </FormDialog>
  )
}

function DeleteClientDialog({ client }: { client: Client }) {
  return (
    <FormDialog
      trigger={
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Supprimer le client"
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash />
        </Button>
      }
      title="Supprimer ce client ?"
      description={`${client.label} sera retiré de clients.json. Ses projets doivent avoir été supprimés au préalable.`}
      submitLabel="Supprimer"
      variant="destructive"
      action={deleteClient}
    >
      <input type="hidden" name="id" value={client.id} />
    </FormDialog>
  )
}

export { CreateClientDialog, EditClientDialog, DeleteClientDialog }
