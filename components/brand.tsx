import Image from "next/image"
import Link from "next/link"

/**
 * `homeHref` scopes the brand link to the current space: the admin dashboard
 * for the admin, the client's own page for a client. Pass `null` to render the
 * brand as plain text, so no navigation is offered at all.
 */
function Brand({ homeHref }: { homeHref: string | null }) {
  const brand = (
    <span className="flex items-center gap-2.5">
      <Image
        src="/logo/logo_icon.svg"
        width={32}
        height={32}
        alt=""
        className="size-8"
      />
      <span className="text-xl font-extrabold tracking-tight">Railflow</span>
    </span>
  )

  if (!homeHref) {
    return brand
  }

  return (
    <Link
      href={homeHref}
      className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {brand}
    </Link>
  )
}

export { Brand }
