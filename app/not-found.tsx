import { AppShell } from "@/components/app-shell"

/**
 * Deliberately offers no link: this page is also what an unknown client id
 * lands on, and it must not hint at the admin dashboard.
 */
export default function NotFound() {
  return (
    <AppShell homeHref={null}>
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="rounded-md bg-primary/20 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-primary-strong">
          ERREUR 404
        </p>
        <h1 className="text-[2rem] leading-tight font-bold tracking-tight">
          Page introuvable
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Cette page n&apos;existe pas ou n&apos;est plus accessible. Vérifiez
          le lien qui vous a été communiqué.
        </p>
      </div>
    </AppShell>
  )
}
