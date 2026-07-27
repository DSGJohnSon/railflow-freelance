import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { IconCalendarCheck, IconCalendarDue } from "@tabler/icons-react"

import { CreateDueDialog } from "@/components/admin/due-dialogs"
import { EditingNotice } from "@/components/admin/editing-notice"
import { CreateQuoteDialog } from "@/components/admin/quote-dialogs"
import { BillingStats } from "@/components/billing-stats"
import { DuesTable } from "@/components/dues-table"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { QuotesTable } from "@/components/quotes-table"
import { Section } from "@/components/section"
import { isEditingEnabled } from "@/lib/editing"
import { formatDate } from "@/lib/format"
import {
  getClient,
  getDues,
  getLastDue,
  getNextDue,
  getProject,
  getProjects,
  summarize,
} from "@/lib/queries"

type Params = { params: Promise<{ clientId: string; projectId: string }> }

/** See the client page: the "en retard" state has to be recomputed daily. */
export const revalidate = 3600

export async function generateStaticParams() {
  const projects = await getProjects()

  return projects.map((project) => ({
    clientId: project.clientId,
    projectId: project.id,
  }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { clientId, projectId } = await params
  const project = await getProject(clientId, projectId)

  return { title: project?.title ?? "Projet introuvable" }
}

export default async function Page({ params }: Params) {
  const { clientId, projectId } = await params
  const client = await getClient(clientId)
  const project = await getProject(clientId, projectId)

  if (!client || !project) {
    notFound()
  }

  const summary = summarize([project])
  const dues = getDues([project])
  const nextDue = getNextDue([project])
  const lastDue = getLastDue([project])
  const editable = isEditingEnabled()

  return (
    <div className="space-y-10">
      <EditingNotice />

      <PageBreadcrumb
        items={[
          { label: client.label, href: `/clients/${client.id}` },
          { label: project.title },
        ]}
      />

      <div className="space-y-3">
        <h1 className="font-heading text-3xl tracking-tight">
          {project.title}
        </h1>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <IconCalendarDue className="size-4 shrink-0" />
            {nextDue ? (
              <>
                Prochaine échéance le{" "}
                <span className="text-foreground">
                  {formatDate(nextDue.date)}
                </span>
              </>
            ) : (
              "Aucune échéance à venir"
            )}
          </li>
          {lastDue ? (
            <li className="flex items-center gap-1.5">
              <IconCalendarCheck className="size-4 shrink-0" />
              Dernière échéance le{" "}
              <span className="text-foreground">
                {formatDate(lastDue.date)}
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <BillingStats summary={summary} />

      <Section
        title="Devis"
        description="Le périmètre contractuel du projet."
        action={
          editable ? <CreateQuoteDialog projectId={project.id} /> : undefined
        }
      >
        <QuotesTable
          quotes={project.quotes ?? []}
          projectId={project.id}
          editable={editable}
        />
      </Section>

      <Section
        title="Échéances de facturation"
        description="Le détail des règlements passés et à venir."
        action={
          editable ? <CreateDueDialog projectId={project.id} /> : undefined
        }
      >
        <DuesTable dues={dues} clientId={client.id} editable={editable} />
      </Section>
    </div>
  )
}
