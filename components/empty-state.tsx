import type { Icon } from "@tabler/icons-react"

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: Icon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <Icon className="size-5 text-muted-foreground" />
      <p className="font-heading text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export { EmptyState }
