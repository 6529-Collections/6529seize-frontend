import type { ReactNode } from "react";

import StreamShell from "@/components/stream/layout/StreamShell";
import { isStreamProductEnabled } from "@/config/streamProduct";

/**
 * The 6529 Stream section. With the feature flag on (local and staging), every
 * page renders inside the section shell. With it off (production), the layout
 * passes the root page through untouched and the sub-pages 404.
 */
export default function StreamLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  if (!isStreamProductEnabled()) {
    return children;
  }
  return <StreamShell>{children}</StreamShell>;
}
