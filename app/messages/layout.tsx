import type { ReactNode } from "react";

// Chat routes render per request: the shell's wave providers, mounted above
// this layout, read the query (`?serialNo=`, `?drop=`) in their server render
// (contexts/ShellSearchParamsContext.tsx). A `connection()` call here would
// come too late to keep Next from prerendering those providers.
export const dynamic = "force-dynamic";

export default function MessagesRouteLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
