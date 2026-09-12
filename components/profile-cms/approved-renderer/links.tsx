"use client";

import type { MouseEventHandler, ReactNode } from "react";
import Link from "next/link";

import {
  getCmsPublicPagePath,
  getCmsPublicPath,
} from "@/lib/profile-cms/runtime/routes";
import { resolveCmsUri } from "@/lib/profile-cms/runtime/uri";
import type { RendererContext } from "../site-renderer/types";
import { useApprovedSession } from "./session";

export function ApprovedLink({
  context,
  pageId,
  blockId,
  href,
  children,
  className,
  current,
  subject,
}: {
  readonly context: RendererContext;
  readonly pageId?: string | undefined;
  readonly blockId?: string | undefined;
  readonly href?: string | undefined;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly current?: boolean | undefined;
  readonly subject?: string | undefined;
}) {
  const session = useApprovedSession();
  const target = getLinkTarget({ context, pageId, blockId, href, subject });
  if (!target) return <span className={className}>{children}</span>;
  const onClick = previewNavigation(
    context,
    target.pageId,
    target.fragment,
    () => {
      session?.setSubject(subject?.slice(0, 200) ?? null);
    }
  );
  if (target.pageId)
    return (
      <Link
        href={target.destination}
        prefetch={false}
        className={className}
        aria-current={current ? "page" : undefined}
        {...(onClick ? { onClick } : {})}
      >
        {children}
      </Link>
    );
  return (
    <a
      href={target.destination}
      className={className}
      aria-current={current ? "page" : undefined}
    >
      {children}
    </a>
  );
}

function getLinkTarget({
  context,
  pageId,
  blockId,
  href,
  subject,
}: {
  readonly context: RendererContext;
  readonly pageId?: string | undefined;
  readonly blockId?: string | undefined;
  readonly href?: string | undefined;
  readonly subject?: string | undefined;
}) {
  const pageHref = pageId
    ? getCmsPublicPagePath(context.cmsPackage, pageId)
    : null;
  const suffix = blockId ? `#${encodeURIComponent(blockId)}` : "";
  const query = subject
    ? `?subject=${encodeURIComponent(subject.slice(0, 200))}`
    : "";
  const safe = pageHref
    ? `${pageHref}${query}${suffix}`
    : resolveCmsUri(href, { allowRelative: true });
  const destination = safe ? getCmsPublicPath(context.cmsPackage, safe) : null;
  if (!destination) return null;
  const [path, fragment] = destination.split("#");
  const targetPageId =
    pageId ??
    context.cmsPackage.payload.pages.find(
      (page) =>
        getCmsPublicPagePath(context.cmsPackage, page.id) ===
        path?.split("?")[0]
    )?.id;
  return { destination, pageId: targetPageId, fragment };
}

function previewNavigation(
  context: RendererContext,
  pageId: string | undefined,
  fragment: string | undefined,
  beforeNavigate: () => void
): MouseEventHandler<HTMLAnchorElement> | undefined {
  const navigate = context.onNavigatePage;
  if (!pageId || !navigate) return undefined;
  return (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    const root = event.currentTarget.closest("[data-cms-approved-design]");
    beforeNavigate();
    navigate(pageId);
    scrollToFragment(root, fragment);
  };
}

function scrollToFragment(root: Element | null, fragment: string | undefined) {
  if (!fragment) return;
  let id: string;
  try {
    id = decodeURIComponent(fragment);
  } catch {
    return;
  }
  requestAnimationFrame(() => {
    const target = Array.from(
      root?.querySelectorAll<HTMLElement>("[data-cms-block-id]") ?? []
    ).find((element) => element.id === id);
    target?.scrollIntoView({ block: "start" });
  });
}
