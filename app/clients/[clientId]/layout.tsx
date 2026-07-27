import * as React from "react"
import { notFound } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getClient } from "@/lib/queries"

/**
 * Everything under this layout is scoped to a single client: the header links
 * back to their own page only, never to the admin dashboard or another client.
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  if (!(await getClient(clientId))) {
    notFound()
  }

  return <AppShell homeHref={`/clients/${clientId}`}>{children}</AppShell>
}
