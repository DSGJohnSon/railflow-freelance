"use server"

import { redirect } from "next/navigation"

import {
  endAdminSession,
  isConfigured,
  startAdminSession,
  verifyPassword,
} from "@/lib/auth"

export type LoginState = { error: string | null }

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isConfigured()) {
    return {
      error:
        "Authentification non configurée : renseignez ADMIN_PASSWORD et ADMIN_SESSION_SECRET.",
    }
  }

  const password = formData.get("password")

  if (typeof password !== "string" || !verifyPassword(password)) {
    return { error: "Mot de passe incorrect." }
  }

  await startAdminSession()
  redirect("/")
}

export async function logout() {
  await endAdminSession()
  redirect("/login")
}
