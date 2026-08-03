import Link from "next/link"
import { IconArrowUpRight, IconMapPin } from "@tabler/icons-react"

import type { Client } from "@/data/types"
import {
  DeleteClientDialog,
  EditClientDialog,
} from "@/components/admin/client-dialogs"
import { BillingBar } from "@/components/billing-bar"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatAddress, formatAmount, initials, plural } from "@/lib/format"
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
    <Card className="group relative h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-heading text-xs font-medium text-secondary-foreground">
            {initials(client.label)}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">
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
              <IconArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-foreground" />
            )}
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <IconMapPin className="mt-0.5 size-4 shrink-0" />
          {formatAddress(client.adress)}
        </p>

        <div className="space-y-2 border-t pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {plural(projects.length, "projet", "projets")}
            </span>
            <span className="font-heading tabular-nums">
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
            <span className="tabular-nums">{formatAmount(summary.paid)}</span>{" "}
            réglés · <span className="tabular-nums">{summary.progress}%</span>{" "}
            du contrat
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export { ClientCard }
