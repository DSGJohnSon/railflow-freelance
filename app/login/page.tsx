import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { IconLock } from "@tabler/icons-react"

import { LoginForm } from "./login-form"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isAdmin } from "@/lib/auth"

export const metadata: Metadata = { title: "Connexion" }

export default async function Page() {
  if (await isAdmin()) {
    redirect("/")
  }

  return (
    <AppShell homeHref={null}>
      <div className="mx-auto max-w-md">
        <Card className="gap-8 py-10 sm:px-4">
          <CardHeader className="justify-items-center gap-2 text-center">
            <span
              aria-hidden
              className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/20 text-primary-strong"
            >
              <IconLock className="size-7" />
            </span>
            <CardTitle className="text-2xl">Administration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cet espace est réservé. Saisissez le mot de passe pour continuer.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
