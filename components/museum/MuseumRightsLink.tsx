import Link from "next/link";

const MUSEUM_RIGHTS_ENTRY_PATH =
  /^\/museum\/network\/rights\/[a-z0-9][a-z0-9.-]*$/u;

export function MuseumRightsLink({
  label,
  href,
  className,
}: {
  readonly label: string;
  readonly href?: string | undefined;
  readonly className: string;
}) {
  if (href === undefined) return label;

  if (href.startsWith("/museum/network/rights")) {
    if (!MUSEUM_RIGHTS_ENTRY_PATH.test(href)) return label;
    return (
      <Link href={href} prefetch={false} rel="license" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="license noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  );
}
