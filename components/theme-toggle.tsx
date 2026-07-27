"use client"

import { useTheme } from "next-themes"
import { IconMoon, IconSun } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // The active theme is unknown while rendering on the server, so both icons
  // are rendered and the `dark` class on <html> decides which one shows.
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Changer de thème"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <IconMoon className="dark:hidden" />
      <IconSun className="hidden dark:block" />
    </Button>
  )
}

export { ThemeToggle }
