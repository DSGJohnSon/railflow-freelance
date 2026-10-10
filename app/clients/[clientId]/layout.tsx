import * as React from "react"
import { notFound } from "next/navigation"
import { IconFolder, IconLayoutDashboard } from "@tabler/icons-react"

import { AppShell } from "@/components/app-shell"
import type { NavGroup } from "@/components/app-sidebar"
import { getClient, getClientProjects } from "@/lib/queries"

/**
 * Everything under this layout is scoped to a single client: the sidebar and
 * the brand link back to their own pages only, never to the admin dashboard or
 * another client.
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await getClient(clientId)

  if (!client) {
    notFound()
  }

  const projects = await getClientProjects(client.id)
  const home = `/clients/${client.id}`

  const nav: NavGroup[] = [
    {
      items: [
        {
          href: home,
          label: "Vue d'ensemble",
          icon: <IconLayoutDashboard />,
        },
      ],
    },
  ]

  if (projects.length > 0) {
    nav.push({
      label: "Projets",
      items: projects.map((project) => ({
        href: `${home}/projects/${project.id}`,
        label: project.title,
        icon: <IconFolder />,
      })),
    })
  }

  return (
    <AppShell
      homeHref={home}
      nav={nav}
      account={{ name: client.label, role: "Espace client" }}
    >
      {children}
    </AppShell>
  )
}
