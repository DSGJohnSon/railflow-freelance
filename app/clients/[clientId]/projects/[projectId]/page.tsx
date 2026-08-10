import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  IconAlertTriangle,
  IconCalendarCheck,
  IconCalendarDue,
} from "@tabler/icons-react"

import { CreateDueDialog } from "@/components/admin/due-dialogs"
import { EditingNotice } from "@/components/admin/editing-notice"
import { CreateQuoteDialog } from "@/components/admin/quote-dialogs"
import { CreateServiceLineDialog } from "@/components/admin/service-line-dialogs"
import { BillingStats } from "@/components/billing-stats"
import { DuesTable } from "@/components/dues-table"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { QuotesTable } from "@/components/quotes-table"
import { Section } from "@/components/section"
import { ServiceLinesTable } from "@/components/service-lines-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isEditingEnabled } from "@/lib/editing"
import { formatAmount, formatDate } from "@/lib/format"
import { paymentDeadline, PAYMENT_TERM_NOTICE } from "@/lib/payment-terms"
import {
  getClient,
  getClients,
  getDues,
  getLastDue,
  getNextDue,
  getProject,
  getProjects,
  lineMismatches,
  summarize,
  summarizeLines,
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

  const clients = await getClients()
  const summary = summarize([project])
  const lines = summarizeLines([project])
  const mismatches = lineMismatches([project])
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
                Prochain règlement attendu le{" "}
                <span className="text-foreground">
                  {formatDate(paymentDeadline(nextDue))}
                </span>
              </>
            ) : (
              "Aucune échéance à venir"
            )}
          </li>
          {lastDue ? (
            <li className="flex items-center gap-1.5">
              <IconCalendarCheck className="size-4 shrink-0" />
              Fin de l&apos;échéancier le{" "}
              <span className="text-foreground">
                {formatDate(paymentDeadline(lastDue))}
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

      {/* Hidden on a project billed as a single block, where an empty state
          between the quotes and the schedule would just be noise — but always
          shown while editing, otherwise the first poste could never be added. */}
      {lines.length > 0 || editable ? (
        <Section
          title="Postes"
          description="Les prestations vendues, et où en est chacune. Une prestation non livrée n'a pas encore de dates : ses mensualités partent de sa mise en service."
          action={
            editable ? (
              <CreateServiceLineDialog
                projectId={project.id}
                quotes={project.quotes ?? []}
                clients={clients}
                projectClientId={project.clientId}
              />
            ) : undefined
          }
        >
          <div className="space-y-4">
            {mismatches.map(({ quote, lined }) => (
              <Alert key={quote.id} variant="destructive">
                <IconAlertTriangle />
                <AlertTitle>
                  Les postes de « {quote.label} » ne totalisent pas le montant
                  du devis
                </AlertTitle>
                <AlertDescription>
                  {formatAmount(lined)} répartis sur les postes contre{" "}
                  {formatAmount(quote.amount)} devisés. L&apos;écart de{" "}
                  {formatAmount(Math.abs(quote.amount - lined))} apparaît en «
                  non démarré » tant que le découpage n&apos;est pas corrigé.
                </AlertDescription>
              </Alert>
            ))}

            <ServiceLinesTable
              lines={lines}
              projectId={project.id}
              clients={clients}
              projectClientId={project.clientId}
              editable={editable}
            />
          </div>
        </Section>
      ) : null}

      <Section
        title="Échéances de facturation"
        description={`Le détail des règlements passés et à venir. ${PAYMENT_TERM_NOTICE}`}
        action={
          editable ? <CreateDueDialog projectId={project.id} /> : undefined
        }
      >
        <DuesTable dues={dues} clients={clients} editable={editable} />
      </Section>
    </div>
  )
}
