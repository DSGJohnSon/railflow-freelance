import Link from "next/link"
import { IconArrowUpRight, IconMapPin } from "@tabler/icons-react"

import type { Client } from "@/data/types"
import {
  DeleteClientDialog,
  EditClientDialog,
} from "@/components/admin/client-dialogs"
import { BillingBar } from "@/components/billing-bar"
import { InitialsAvatar } from "@/components/initials-avatar"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatAddress, formatAmount, plural } from "@/lib/format"
import { getClientProjects, summarize } from "@/lib/queries"

async function ClientCard({
  client,
  editable = false,
}: {
  client: Client
  editable?: boolean
}) {
  const projects = await getClientProjects(client.id)
  const summary = summarize(projects)

  return (
    // The title link is stretched over the whole card, so the action buttons
    // can sit next to it instead of nested inside an anchor.
    <Card className="group relative h-full gap-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        {/* `min-w-0`: as a grid item it would otherwise grow to the full
            title, pushing the actions out of the card instead of truncating. */}
        <div className="flex min-w-0 items-start gap-3">
          <InitialsAvatar label={client.label} className="size-12 text-base" />
          <div className="min-w-0 flex-1 pt-0.5">
            <CardTitle className="truncate text-lg">
              <Link
                href={`/clients/${client.id}`}
                className="rounded-xl outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {client.label}
              </Link>
            </CardTitle>
            {client.contact ? (
              <p className="truncate text-sm text-muted-foreground">
                {client.contact}
              </p>
            ) : null}
          </div>
          <CardAction className="relative z-10 flex items-center gap-0.5">
            {editable ? (
              <>
                <EditClientDialog client={client} />
                <DeleteClientDialog client={client} />
              </>
            ) : (
              <IconArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-primary-strong" />
            )}
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <IconMapPin className="mt-0.5 size-4 shrink-0" />
          {formatAddress(client.adress)}
        </p>

        <div className="space-y-2.5 rounded-xl bg-muted/60 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {plural(projects.length, "projet", "projets")}
            </span>
            <span className="text-lg font-bold tabular-nums">
              {formatAmount(summary.quoted)}
            </span>
          </div>
          <BillingBar
            total={summary.quoted}
            paid={summary.paid}
            waiting={summary.waiting}
            planned={summary.planned}
            notStarted={summary.notStarted}
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {formatAmount(summary.paid)}
            </span>{" "}
            réglés ·{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {summary.progress}%
            </span>{" "}
            du contrat
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { ClientCard }
