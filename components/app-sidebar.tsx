"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { IconMenu2, IconX } from "@tabler/icons-react"

import { InitialsAvatar } from "@/components/initials-avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type NavItem = {
  href: string
  label: string
  /** Rendered on the server and handed over as an element. */
  icon?: React.ReactNode
  /** Shows the label's initials instead of an icon — for clients. */
  avatar?: boolean
}

export type NavGroup = {
  /** The small uppercase caption above the group, like DashStack's "PAGES". */
  label?: string
  items: NavItem[]
}

function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[]
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation principale"
      className="flex-1 overflow-y-auto pb-4"
    >
      {groups.map((group, index) => (
        <div
          key={group.label ?? index}
          className={cn("py-4", index > 0 && "border-t border-sidebar-border")}
        >
          {group.label ? (
            <p className="px-10 pb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              // Exact match only: every entry is a page of its own, and the
              // overview must not stay lit on the pages listed beneath it.
              const active = pathname === item.href

              return (
                <li key={item.href} className="relative px-6">
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-1.5 rounded-r-md bg-sidebar-primary"
                    />
                  ) : null}
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-5 [&_svg]:shrink-0",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    {item.avatar ? (
                      <InitialsAvatar
                        label={item.label}
                        className={cn(
                          "size-7 text-[0.6875rem]",
                          active &&
                            "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                        )}
                      />
                    ) : (
                      item.icon
                    )}
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** The sidebar as a drawer, below `lg` where there is no room to pin it. */
function MobileSidebar({
  brand,
  groups,
  footer,
}: {
  brand: React.ReactNode
  groups: NavGroup[]
  footer?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            aria-label="Ouvrir le menu"
          />
        }
      >
        <IconMenu2 className="size-5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 duration-150 lg:hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl duration-200 outline-none lg:hidden data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <DialogPrimitive.Title className="sr-only">
            Menu
          </DialogPrimitive.Title>
          <div className="flex h-17.5 shrink-0 items-center justify-between gap-2 pr-4 pl-8">
            {brand}
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Fermer" />
              }
            >
              <IconX />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav groups={groups} onNavigate={() => setOpen(false)} />
          {footer ? (
            <div className="border-t border-sidebar-border px-6 py-4">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { MobileSidebar, SidebarNav }
