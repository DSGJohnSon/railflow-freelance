"use client"

import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import type { Project } from "@/data/types"
import { Field, FormDialog } from "@/components/admin/form-dialog"
import { Button } from "@/components/ui/button"
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/actions/projects"

function CreateProjectDialog({ clientId }: { clientId: string }) {
  return (
    <FormDialog
      trigger={
        <Button size="sm" variant="outline">
          <IconPlus />
          Ajouter un projet
        </Button>
      }
      title="Nouveau projet"
      submitLabel="Créer"
      action={createProject}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <Field label="Titre" name="title" required autoFocus />
    </FormDialog>
  )
}

function EditProjectDialog({ project }: { project: Project }) {
  return (
    <FormDialog
      trigger={
        <Button size="icon-sm" variant="ghost" aria-label="Modifier le projet">
          <IconPencil />
        </Button>
      }
      title="Modifier le projet"
      description="L'identifiant reste inchangé : il fait partie de l'URL communiquée au client."
      action={updateProject}
    >
      <input type="hidden" name="id" value={project.id} />
      <Field
        label="Titre"
        name="title"
        defaultValue={project.title}
        required
        autoFocus
      />
    </FormDialog>
  )
}

function DeleteProjectDialog({ project }: { project: Project }) {
  const quotes = project.quotes?.length ?? 0
  const dues = project.dues?.length ?? 0

  return (
    <FormDialog
      trigger={
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Supprimer le projet"
          className="text-muted-foreground hover:text-destructive"
        >
          <IconTrash />
        </Button>
      }
      title="Supprimer ce projet ?"
      description={`${project.title} sera supprimé, avec ses ${quotes} devis et ses ${dues} échéances. Les PDF devenus orphelins seront effacés.`}
      submitLabel="Supprimer"
      variant="destructive"
      action={deleteProject}
    >
      <input type="hidden" name="id" value={project.id} />
    </FormDialog>
  )
}

export { CreateProjectDialog, EditProjectDialog, DeleteProjectDialog }
