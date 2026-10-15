"use client";

import "@/i18n/namespaces/public-review";

import type { ReactNode } from "react";

/**
 * Registers the review-only `publicReview.*` copy for client components.
 * Loading this module registers it, so the copy is in place before anything
 * below this component renders, during server rendering and in the browser.
 */
export default function PublicReviewMessages({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
