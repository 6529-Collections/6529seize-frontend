"use client";

import "@/i18n/namespaces/public-review";

import type { ReactNode } from "react";

/**
 * Backstop for the review routes. Review client components import the
 * `publicReview.*` namespace themselves. This wrapper also registers it before
 * anything below it renders, during server rendering and in the browser, so a
 * shared client component given a review key still finds the copy.
 */
export default function PublicReviewMessages({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
