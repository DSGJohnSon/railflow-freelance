import * as React from "react"
import Link from "next/link"
import { IconRouteSquare } from "@tabler/icons-react"

import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

/**
 * `homeHref` scopes the brand link to the current space: the admin dashboard
 * for the admin, the client's own page for a client. Pass `null` to render the
 * brand as plain text, so no navigation is offered at all.
 */
function SiteHeader({
  homeHref,
  actions,
}: {
  homeHref: string | null
  actions?: React.ReactNode
}) {
  const brand = (
    <div className="flex items-center gap-2">
      <div className="aspect-square w-6 pb-1">
        <Image
          src={"/logo/logo_icon.svg"}
          width={500}
          height={500}
          alt="decorative"
          className="object-cointain"
        />
      </div>
      <span className="font-heading text-sm font-medium tracking-tight">
        Railflow
      </span>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        {homeHref ? (
          <Link
            href={homeHref}
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {brand}
          </Link>
        ) : (
          <span className="flex items-center gap-2">{brand}</span>
        )}

        <div className="flex items-center gap-1">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
