"use client"

import { useActionState } from "react"
import { IconAlertTriangle, IconLock } from "@tabler/icons-react"

import { login, type LoginState } from "./actions"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: LoginState = { error: null }

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
        />
      </div>

      {state.error ? (
        <Alert variant="destructive" id="password-error">
          <IconAlertTriangle />
          <AlertTitle>{state.error}</AlertTitle>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        <IconLock />
        {pending ? "Vérification…" : "Se connecter"}
      </Button>
    </form>
  )
}

export { LoginForm }
