import { notFound, permanentRedirect } from "next/navigation";

/**
 * Any address under /explained that names no page: 6529 Explained's own
 * not-found view (../not-found.tsx), never the site-wide one. A guessed
 * address for an answer that lives on the hub goes to it: /explained/cc0
 * is CC0 in one minute, until The Memes and CC0 has its own page.
 */
const ON_THE_HUB: Readonly<Record<string, string>> = {
  cc0: "/explained#cc0",
};

export default async function ExplainedUnknownPage({
  params,
}: {
  readonly params: Promise<{ readonly rest?: readonly string[] }>;
}): Promise<never> {
  const { rest = [] } = await params;
  const target =
    rest.length === 1 ? ON_THE_HUB[(rest[0] ?? "").toLowerCase()] : undefined;
  if (target !== undefined) {
    permanentRedirect(target);
  }
  notFound();
}
