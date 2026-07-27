import type { Metadata } from "next"
import { redirect } from "next/navigation"

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
      <div className="mx-auto max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
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
