import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * `card` puts the heading and the content in one white card, as DashStack does
 * for its tables ("Deals Details"). Leave it off for content that is made of
 * cards already — a grid of them would otherwise end up nested in another.
 *
 * Inside a card the padding is `p-4` below `md`, so stacked mobile lists can
 * bleed to the edges with a matching `-mx-4`.
 */
function Section({
  title,
  description,
  action,
  card = false,
  className,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  card?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "space-y-5",
        card &&
          "overflow-hidden rounded-xl bg-card p-4 text-card-foreground shadow-card ring-1 ring-foreground/5 md:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export { Section }
