import * as React from "react"

import { SiteHeader } from "@/components/site-header"

function AppShell({
  homeHref,
  actions,
  children,
}: {
  homeHref: string | null
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader homeHref={homeHref} actions={actions} />
      <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">{children}</main>
    </>
  )
}

export { AppShell }
