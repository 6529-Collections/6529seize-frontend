import Link from "next/link";
import type { ReactNode } from "react";

import {
  getCmsPublicPagePath,
  resolveCmsRoute,
} from "@/lib/profile-cms/runtime/routes";
import type { RendererContext } from "./types";

import { isExternalCmsHref } from "@/lib/profile-cms/runtime/uri";

export function UnsupportedBlock({
  label,
  className = "tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400",
}: {
  readonly label: string;
  readonly className?: string | undefined;
}) {
  return <div className={className}>{label}</div>;
}

export function CmsLink({
  href,
  className,
  children,
  context,
}: {
  readonly href: string;
  readonly className?: string | undefined;
  readonly children: ReactNode;
  readonly context?: RendererContext | undefined;
}) {
  const pageId = context?.onNavigatePage
    ? getPreviewPageId(context, href)
    : null;
  if (pageId && context?.onNavigatePage) {
    return (
      <a
        className={className}
        href={href}
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          context.onNavigatePage?.(pageId);
        }}
      >
        {children}
      </a>
    );
  }
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

function getPreviewPageId(
  context: RendererContext,
  href: string
): string | null {
  if (href.startsWith("//") || href.startsWith("#")) return null;
  try {
    const url = new URL(href, "https://6529.io");
    if (
      url.origin !== "https://6529.io" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const page = context.cmsPackage.payload.pages.find(
      (candidate) =>
        getCmsPublicPagePath(context.cmsPackage, candidate.id) === url.pathname
    );
    if (page) return page.id;
    const route = resolveCmsRoute(context.cmsPackage, url.pathname);
    return route.kind === "page" ? route.page.id : null;
  } catch {
    return null;
  }
}
