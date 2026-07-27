import type { Metadata } from "next"

import { CreateClientDialog } from "@/components/admin/client-dialogs"
import { EditingNotice } from "@/components/admin/editing-notice"
import { AppShell } from "@/components/app-shell"
import { BillingStats } from "@/components/billing-stats"
import { ClientCard } from "@/components/client-card"
import { LogoutButton } from "@/components/logout-button"
import { Section } from "@/components/section"
import { requireAdmin } from "@/lib/auth"
import { isEditingEnabled } from "@/lib/editing"
import { plural } from "@/lib/format"
import { getClients, getProjects, summarize } from "@/lib/queries"

export const metadata: Metadata = { title: "Administration" }

export default async function Page() {
  await requireAdmin()

  const clients = await getClients()
  const projects = await getProjects()
  const summary = summarize(projects)
  const editable = isEditingEnabled()

  return (
    <AppShell homeHref="/" actions={<LogoutButton />}>
      <div className="space-y-12">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl tracking-tight">
            Administration
          </h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble du portefeuille. Chaque client accède uniquement
            à sa propre page.
          </p>
        </div>

        <EditingNotice />

        <BillingStats summary={summary} />

        <Section
          title="Clients"
          description={`${plural(
            clients.length,
            "client",
            "clients"
          )} · ${plural(projects.length, "projet", "projets")}`}
          action={editable ? <CreateClientDialog /> : undefined}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} editable={editable} />
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  )
}
