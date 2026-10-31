import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { resolveMemeLabRoute } from "./memeLabRouteResolution";

// Resolve the card before any streaming boundary can commit a 200 status, so
// unknown ids (including the nested distribution route) answer with a real 404.
export default async function MemeLabCardLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if ((await resolveMemeLabRoute(id)).kind === "missing") notFound();
  return children;
}
