import { notFound } from "next/navigation";

/**
 * Any address under /explained that names no page: 6529 Explained's own
 * not-found view (../not-found.tsx), never the site-wide one.
 */
export default function ExplainedUnknownPage(): never {
  notFound();
}
