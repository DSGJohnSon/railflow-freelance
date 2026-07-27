import Link from "next/link"
import { IconArrowUpRight } from "@tabler/icons-react"

import type { Project } from "@/data/types"
import {
  DeleteProjectDialog,
  EditProjectDialog,
} from "@/components/admin/project-dialogs"
import { AmountBar } from "@/components/amount-bar"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatAmount, formatDate, plural } from "@/lib/format"
import { getNextDue, summarize } from "@/lib/queries"

function ProjectCard({
  project,
  editable = false,
}: {
  project: Project
  editable?: boolean
}) {
  const summary = summarize([project])
  const nextDue = getNextDue([project])
  const quotes = project.quotes ?? []
  const dues = project.dues ?? []

  return (
    <Card className="group relative h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">
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
          </div>
          <CardAction className="relative z-10 flex items-center gap-0.5">
            {editable ? (
              <>
                <EditProjectDialog project={project} />
                <DeleteProjectDialog project={project} />
              </>
            ) : (
              <IconArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-foreground" />
            )}
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-heading text-lg tabular-nums">
              {formatAmount(summary.quoted)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {summary.progress}% réglé
            </span>
          </div>
          <AmountBar value={summary.progress} />
        </div>

        <p className="border-t pt-4 text-sm text-muted-foreground">
          {nextDue ? (
            <>
              Prochaine échéance le{" "}
              <span className="text-foreground">
                {formatDate(nextDue.date)}
              </span>
            </>
          ) : (
            "Aucune échéance à venir"
          )}
        </p>
      </CardContent>
    </Card>
  )
}

export { ProjectCard }
