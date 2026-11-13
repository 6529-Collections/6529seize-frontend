"use client";

import {
  getProfileCollectedReturnContext,
  PROFILE_COLLECTED_RETURN_PARAM,
} from "@/helpers/profile-collected-navigation";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ComponentProps } from "react";
import { restoreCollectedActivityLink } from "./restoreCollectedActivityLink";

/** Preserve the Collected return context and restore the matching activity row. */
export default function ProfileCollectedActivityLink({
  href,
  activityKey,
  onNavigate,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "ref" | "id"> & {
  readonly href: string;
  readonly activityKey: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const anchor = `collected-activity-${activityKey}`;
  const returnContext = getProfileCollectedReturnContext(
    `${pathname}?${searchParams.toString()}#${anchor}`
  );
  const separator = href.includes("?") ? "&" : "?";
  const linkHref =
    href && returnContext
      ? `${href}${separator}${new URLSearchParams({
          [PROFILE_COLLECTED_RETURN_PARAM]: returnContext.href,
        }).toString()}`
      : href;

  useEffect(() => {
    const link = linkRef.current;
    return link ? restoreCollectedActivityLink(link) : undefined;
  }, [anchor]);

  return (
    <Link
      {...props}
      ref={linkRef}
      id={anchor}
      href={linkHref}
      onNavigate={(event) => {
        const navigation = { cancelled: false };
        onNavigate?.({
          preventDefault: () => {
            navigation.cancelled = true;
            event.preventDefault();
          },
        });
        if (navigation.cancelled || !returnContext) return;

        // Save the row on the entry browser Back will revisit, too. The
        // returnTo link alone only covers the explicit mobile return action.
        // onNavigate excludes modified clicks and new-tab/download actions.
        const source = new URL(globalThis.location.href);
        source.hash = anchor;
        globalThis.history.replaceState(globalThis.history.state, "", source);
      }}
    />
  );
}
