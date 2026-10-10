import { IconLogout } from "@tabler/icons-react"

import { logout } from "@/app/login/actions"

/** Styled as a sidebar entry: it sits at the foot of the navigation. */
function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex min-h-12 w-full items-center gap-3 rounded-md px-4 text-sm font-semibold text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <IconLogout className="size-5 shrink-0" />
        Déconnexion
      </button>
    </form>
  )
}

export { LogoutButton }
