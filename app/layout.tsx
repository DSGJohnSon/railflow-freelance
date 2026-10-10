import type { Metadata } from "next"
import { Geist_Mono, Nunito_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// Body and headings share this family, as in DashStack: the hierarchy comes
// from weight and size — `--font-heading` points here in globals.css.
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Railflow — Espace client",
    template: "%s — Railflow",
  },
  description:
    "Suivez vos projets, vos devis et vos échéances de facturation en un coup d'œil.",
  // Client pages are reachable by anyone holding the URL, so nothing here
  // should ever end up in a search index.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        nunitoSans.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
