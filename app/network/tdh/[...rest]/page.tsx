import { notFound } from "next/navigation";

/**
 * Any address under /network/tdh that names no page: the chapter's own
 * not-found view (./../not-found.tsx), never the site-wide one.
 */
export default function TdhUnknownPage(): never {
  notFound();
}
