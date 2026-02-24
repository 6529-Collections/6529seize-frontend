import { redirect } from "next/navigation";

type PageProps = {
  readonly params?: Promise<{ user: string }> | undefined;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>> | undefined;
};

export default async function IdentityRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user ?? "";
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const query = new URLSearchParams();
  if (resolvedSearchParams) {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          query.append(key, v);
        }
      } else {
        query.append(key, value);
      }
    }
  }

  const qs = query.toString();
  redirect(`/${user}${qs ? `?${qs}` : ""}`);
}
