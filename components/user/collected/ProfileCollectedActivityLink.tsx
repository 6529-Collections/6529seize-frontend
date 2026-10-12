"use client";

import {
  getProfileCollectedReturnContext,
  PROFILE_COLLECTED_RETURN_PARAM,
} from "@/helpers/profile-collected-navigation";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ComponentProps } from "react";

export default function ProfileCollectedActivityLink({
  href,
  activityKey,
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
  const linkHref =
    href && returnContext
      ? `${href}?${new URLSearchParams({
          [PROFILE_COLLECTED_RETURN_PARAM]: returnContext.href,
        }).toString()}`
      : href;

  useEffect(() => {
    if (globalThis.location.hash !== `#${anchor}`) return;
    linkRef.current?.focus({ preventScroll: true });
    linkRef.current?.scrollIntoView({ block: "center" });
  }, [anchor]);

  return <Link {...props} ref={linkRef} id={anchor} href={linkHref} />;
}
