import "@/i18n/namespaces/public-review";

import type { ReactNode } from "react";

import PublicReviewMessages from "@/components/public-review/PublicReviewMessages";

// Review modules that read review copy import the namespace themselves. This
// layout and PublicReviewMessages also register it for the whole route, on the
// server and in the browser, so a shared component given a review key still
// finds the copy.
export default function PublicReviewLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <PublicReviewMessages>{children}</PublicReviewMessages>;
}
