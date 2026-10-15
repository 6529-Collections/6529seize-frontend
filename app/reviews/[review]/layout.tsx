import "@/i18n/namespaces/public-review";

import type { ReactNode } from "react";

import PublicReviewMessages from "@/components/public-review/PublicReviewMessages";

// Review copy is not in the shared message bundle. The import above registers
// it for the server components and metadata of every review page, and
// PublicReviewMessages does the same for their client components.
export default function PublicReviewLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return <PublicReviewMessages>{children}</PublicReviewMessages>;
}
