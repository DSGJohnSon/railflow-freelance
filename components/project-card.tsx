import Link from "next/link"
import {
  IconArrowUpRight,
  IconCalendarDue,
  IconFolder,
} from "@tabler/icons-react"

import type { Project } from "@/data/types"
import {
  DeleteProjectDialog,
  EditProjectDialog,
} from "@/components/admin/project-dialogs"
import { BillingBar } from "@/components/billing-bar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatAmount, formatDate, plural } from "@/lib/format"
import { paymentDeadline } from "@/lib/payment-terms"
import { getNextDue, summarize } from "@/lib/queries"

function ProjectCard({
  project,
  note,
  editable = false,
}: {
  project: Project
  /**
   * Why the card sits on a page that does not own the project — e.g. a client
   * listed as billing entity of another client's project.
   */
  note?: string
  editable?: boolean
}) {
  const summary = summarize([project])
  const nextDue = getNextDue([project])
  const quotes = project.quotes ?? []
  const dues = project.dues ?? []

  return (
    <Card className="group relative h-full gap-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader>
        {/* `min-w-0`: as a grid item it would otherwise grow to the full
            title, pushing the actions out of the card instead of truncating. */}
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground"
          >
            <IconFolder className="size-6" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <CardTitle className="truncate text-lg">
              <Link
                href={`/clients/${project.clientId}/projects/${project.id}`}
                className="rounded-xl outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {project.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {plural(quotes.length, "devis", "devis")} ·{" "}
              {plural(dues.length, "échéance", "échéances")}
            </p>
            {note ? (
              <Badge variant="outline" className="mt-2 text-muted-foreground">
                {note}
              </Badge>
            ) : null}
          </div>
          <CardAction className="relative z-10 flex items-center gap-0.5">
            {editable ? (
              <>
                <EditProjectDialog project={project} />
                <DeleteProjectDialog project={project} />
              </>
            ) : (
              <IconArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-primary-strong" />
            )}
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2.5 rounded-xl bg-muted/60 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xl font-bold tabular-nums">
              {formatAmount(summary.quoted)}
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {summary.progress}%
              </span>{" "}
              du contrat
            </span>
          </div>
          <BillingBar
            total={summary.quoted}
            paid={summary.paid}
            waiting={summary.waiting}
            planned={summary.planned}
            notStarted={summary.notStarted}
          />
        </div>

        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <IconCalendarDue className="mt-0.5 size-4 shrink-0" />
          <span>
            {nextDue ? (
              <>
                Prochain règlement attendu le{" "}
                <span className="font-semibold text-foreground">
                  {formatDate(paymentDeadline(nextDue))}
                </span>
              </>
            ) : (
              "Aucune échéance à venir"
            )}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

export { ProjectCard }
