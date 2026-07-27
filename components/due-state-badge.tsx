import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconClock,
  IconClockExclamation,
} from "@tabler/icons-react"

import type { DueState } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const states = {
  PAID: {
    label: "Payée",
    icon: IconCircleCheckFilled,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
  LATE: {
    label: "En retard",
    icon: IconClockExclamation,
    className:
      "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400",
  },
  WAITING: {
    label: "En attente",
    icon: IconClock,
    className:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400",
  },
  FUTURE: {
    label: "À venir",
    icon: IconCircleDashed,
    className: "bg-muted text-muted-foreground",
  },
} satisfies Record<
  DueState,
  { label: string; icon: typeof IconClock; className: string }
>

function DueStateBadge({
  state,
  className,
}: {
  state: DueState
  className?: string
}) {
  const { label, icon: Icon, ...rest } = states[state]

  return (
    <Badge variant="secondary" className={cn(rest.className, className)}>
      <Icon />
      {label}
    </Badge>
  )
}

export { DueStateBadge, states as dueStates }
