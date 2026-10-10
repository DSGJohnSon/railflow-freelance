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
    className: "bg-success/15 text-success-strong",
  },
  LATE: {
    label: "En retard",
    icon: IconClockExclamation,
    className: "bg-danger/12 text-danger-strong",
  },
  WAITING: {
    label: "En attente",
    icon: IconClock,
    className: "bg-warning/20 text-warning-strong",
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
