import * as React from "react"

import { SidebarNav, type NavGroup } from "@/components/app-sidebar"
import { Brand } from "@/components/brand"
import { SiteHeader, type Account } from "@/components/site-header"

/**
 * With `nav`, the DashStack layout: a sidebar pinned on the left from `lg`,
 * a drawer below. Without it — login, 404 — a bare header over a centred
 * column, so nothing hints at pages the visitor has no business seeing.
 */
function AppShell({
  homeHref,
  nav,
  footer,
  account,
  actions,
  children,
}: {
  homeHref: string | null
  nav?: NavGroup[]
  /** Pinned to the bottom of the sidebar, like DashStack's "Logout". */
  footer?: React.ReactNode
  account?: Account
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const brand = <Brand homeHref={homeHref} />

  if (!nav) {
    return (
      <>
        <SiteHeader brand={brand} account={account} actions={actions} />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-14">
          {children}
        </main>
      </>
    )
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-17.5 shrink-0 items-center px-8">{brand}</div>
        <SidebarNav groups={nav} />
        {footer ? (
          <div className="border-t border-sidebar-border px-6 py-4">
            {footer}
          </div>
        ) : null}
      </aside>

      <div className="lg:pl-60">
        <SiteHeader
          brand={brand}
          nav={nav}
          footer={footer}
          account={account}
          actions={actions}
        />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </>
  )
}

export { AppShell }
