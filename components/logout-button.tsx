import { IconLogout } from "@tabler/icons-react"

import { logout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm">
        <IconLogout />
        Déconnexion
      </Button>
    </form>
  )
}

export { LogoutButton }
