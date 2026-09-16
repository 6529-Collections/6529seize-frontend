"use client";

import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Image from "next/image";

export const SIDEBAR_AVATAR_TIMEOUT_MS = 10_000;

/** The parent keys this by account and URL so an old PFP never flashes. */
export default function WebSidebarAccountAvatar({
  src,
}: {
  readonly src: string | null;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading"
  );

  useEffect(() => {
    if (!src || status !== "loading") return;
    const timeout = setTimeout(
      () => setStatus("failed"),
      SIDEBAR_AVATAR_TIMEOUT_MS
    );
    return () => clearTimeout(timeout);
  }, [src, status]);

  if (!src || status === "failed") {
    return (
      <UserCircleIcon
        className="tw-size-10 tw-text-iron-400"
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      {status === "loading" && (
        <span
          className="tw-absolute tw-inset-0 tw-rounded-xl tw-bg-iron-800 motion-safe:tw-animate-pulse"
          aria-hidden="true"
        />
      )}
      <Image
        unoptimized
        loading="eager"
        width={40}
        height={40}
        src={src}
        alt=""
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
        className={`tw-absolute tw-inset-0 tw-block tw-size-10 tw-rounded-xl tw-object-contain ${status === "loaded" ? "tw-opacity-100" : "tw-opacity-0"}`}
      />
    </>
  );
}
