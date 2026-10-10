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
    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="text-base font-bold">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export { EmptyState }
