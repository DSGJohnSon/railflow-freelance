import * as React from "react"

import { MobileSidebar, type NavGroup } from "@/components/app-sidebar"
import { InitialsAvatar } from "@/components/initials-avatar"
import { ThemeToggle } from "@/components/theme-toggle"

export type Account = {
  name: string
  /** The line under the name, like DashStack's "Admin". */
  role: string
}

/**
 * With `nav`, the brand lives in the sidebar and only shows here below `lg`,
 * next to the button opening the sidebar as a drawer. Without it, the header
 * is the whole chrome and always carries the brand.
 */
function SiteHeader({
  brand,
  nav,
  footer,
  account,
  actions,
}: {
  brand: React.ReactNode
  nav?: NavGroup[]
  footer?: React.ReactNode
  account?: Account
  actions?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card">
      <div className="flex h-17.5 items-center justify-between gap-4 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          {nav ? (
            <>
              <MobileSidebar brand={brand} groups={nav} footer={footer} />
              <div className="lg:hidden">{brand}</div>
            </>
          ) : (
            brand
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {actions}
          <ThemeToggle />
          {account ? (
            <div className="flex min-w-0 items-center gap-3 border-l pl-3 sm:pl-5">
              <InitialsAvatar label={account.name} />
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-48 truncate text-sm font-bold">
                  {account.name}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {account.role}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
