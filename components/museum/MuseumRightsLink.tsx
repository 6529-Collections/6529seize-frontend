import Link from "next/link";

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

  if (href.startsWith("/museum/network/rights/")) {
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
