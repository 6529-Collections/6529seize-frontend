import Link from "next/link";
import type { ReactNode } from "react";

import { isExternalCmsHref } from "@/lib/profile-cms/runtime/uri";

export function UnsupportedBlock({ label }: { readonly label: string }) {
  return (
    <div className="tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400">
      {label}
    </div>
  );
}

export function CmsLink({
  href,
  className,
  children,
}: {
  readonly href: string;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) {
  if (isExternalCmsHref(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}
