import { redirect } from "next/navigation";

type UserRouteParams = { user: string };
type UserSearchParams = Record<string, string | string[] | undefined>;

const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): URLSearchParams => {
  const normalizedParams = new URLSearchParams();

  if (!params) {
    return normalizedParams;
  }

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      normalizedParams.append(key, value);
    }
    return normalizedParams;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        normalizedParams.append(key, entry);
      }
      continue;
    }

    normalizedParams.append(key, value);
  }

  return normalizedParams;
};

export default async function LegacyWavesPage({
  params,
  searchParams,
}: {
  readonly params?: Promise<UserRouteParams> | undefined;
  readonly searchParams?: Promise<UserSearchParams> | undefined;
}) {
  const resolvedParams = params ? await params : undefined;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = resolvedParams?.user;

  if (!user) {
    redirect("/");
  }

  const queryString = normalizeSearchParams(resolvedSearchParams).toString();
  const basePath = `/${encodeURIComponent(user)}/curations`;
  const destination = queryString ? `${basePath}?${queryString}` : basePath;

  redirect(destination);
}
