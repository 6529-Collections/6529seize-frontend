import { redirect } from "next/navigation";

type PageProps = {
  readonly params?: Promise<{ user: string }> | undefined;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>> | undefined;
};

function buildQueryString(
  params: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : value !== undefined ? [value] : [];
    values.forEach((v) => query.append(key, v));
  }
  return query.toString();
}

export default async function IdentityRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = params ? await params : undefined;
  const user = resolvedParams?.user ?? "";
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const qs = resolvedSearchParams ? buildQueryString(resolvedSearchParams) : "";
  const destination = qs ? `/${user}?${qs}` : `/${user}`;
  redirect(destination);
}
