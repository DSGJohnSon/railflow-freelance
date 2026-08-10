import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { IconFolders, IconId, IconMapPin, IconUser } from "@tabler/icons-react"

import { EditClientDialog } from "@/components/admin/client-dialogs"
import { EditingNotice } from "@/components/admin/editing-notice"
import { CreateProjectDialog } from "@/components/admin/project-dialogs"
import { BillingStats } from "@/components/billing-stats"
import { DuesTable } from "@/components/dues-table"
import { EmptyState } from "@/components/empty-state"
import { ProjectCard } from "@/components/project-card"
import { Section } from "@/components/section"
import { isEditingEnabled } from "@/lib/editing"
import { formatAddress, initials, plural } from "@/lib/format"
import { PAYMENT_TERM_NOTICE } from "@/lib/payment-terms"
import {
  getClient,
  getClientProjects,
  getClients,
  getDues,
  getProjects,
  summarize,
} from "@/lib/queries"

type Params = { params: Promise<{ clientId: string }> }

/**
 * A due turns "en retard" by the calendar alone, so a page prerendered once at
 * build time would keep serving the verdict of the day it was built. Hourly is
 * plenty for a state that only ever changes at midnight.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const clients = await getClients()

  return clients.map((client) => ({ clientId: client.id }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { clientId } = await params
  const client = await getClient(clientId)

  return { title: client?.label ?? "Client introuvable" }
}

export default async function Page({ params }: Params) {
  const { clientId } = await params
  const client = await getClient(clientId)

  if (!client) {
    notFound()
  }

  const projects = await getClientProjects(client.id)
  const clients = await getClients()

  // Projects owned by another client but billing at least one poste through
  // this entity. Listed as cross-links to their canonical page, nothing more:
  // the contractual figures stay with the owner, so nothing is counted twice.
  const billedVia = (await getProjects()).filter(
    (project) =>
      project.clientId !== client.id &&
      (project.quotes ?? []).some((quote) =>
        (quote.lines ?? []).some((line) => line.billedTo === client.id)
      )
  )

  const summary = summarize(projects)
  const dues = getDues(projects)
  const editable = isEditingEnabled()

  return (
    <div className="space-y-10">
      <EditingNotice />

      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary font-heading text-sm font-medium text-secondary-foreground">
          {initials(client.label)}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="font-heading text-3xl tracking-tight">
            {client.label}
          </h1>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {client.contact ? (
              <li className="flex items-center gap-1.5">
                <IconUser className="size-4 shrink-0" />
                {client.contact}
              </li>
            ) : null}
            <li className="flex items-center gap-1.5">
              <IconMapPin className="size-4 shrink-0" />
              {formatAddress(client.adress)}
            </li>
            {client.siret ? (
              <li className="flex items-center gap-1.5">
                <IconId className="size-4 shrink-0" />
                <span className="font-mono text-xs">SIRET {client.siret}</span>
              </li>
            ) : null}
          </ul>
        </div>
        {editable ? <EditClientDialog client={client} /> : null}
      </div>

      <BillingStats summary={summary} />

      <Section
        title="Projets"
        description={
          billedVia.length > 0
            ? `${plural(projects.length, "projet", "projets")} · ${plural(
                billedVia.length,
                "projet facturé via cette entité",
                "projets facturés via cette entité"
              )}`
            : plural(projects.length, "projet", "projets")
        }
        action={
          editable ? <CreateProjectDialog clientId={client.id} /> : undefined
        }
      >
        {projects.length > 0 || billedVia.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                editable={editable}
              />
            ))}
            {/* Read-only on purpose: the project belongs to another client,
                and its card here is a doorway, not a second control panel. */}
            {billedVia.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                note="Entité de facturation"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={IconFolders}
            title="Aucun projet"
            description="Aucun projet n'est encore rattaché à ce client."
          />
        )}
      </Section>

      <Section
        title="Échéances de facturation"
        description={`Toutes les échéances, payées et à venir. ${PAYMENT_TERM_NOTICE}`}
      >
        <DuesTable
          dues={dues}
          clients={clients}
          showProject={projects.length > 1}
          editable={editable}
        />
      </Section>
    </div>
  )
}
