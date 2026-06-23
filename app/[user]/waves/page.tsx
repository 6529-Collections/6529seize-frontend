import { redirect } from "next/navigation";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";

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
  readonly params?: Promise<UserRouteParams>;
  readonly searchParams?: Promise<UserSearchParams>;
}) {
  const resolvedParams = params ? await params : undefined;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = resolvedParams?.user;

  if (!user) {
    redirect("/");
  }

  const queryString = normalizeSearchParams(resolvedSearchParams).toString();
  let basePath = `/${encodeURIComponent(user)}`;

  try {
    const profile = await getUserProfile({
      user: user.toLowerCase(),
      headers: await getAppCommonHeaders(),
    });
    const canonicalUser = profile.handle ?? profile.primary_wallet;

    basePath = profile.profile_wave_id
      ? `/${encodeURIComponent(canonicalUser)}/curations`
      : `/${encodeURIComponent(canonicalUser)}`;
  } catch {
    basePath = `/${encodeURIComponent(user)}`;
  }

  const destination = queryString ? `${basePath}?${queryString}` : basePath;

  redirect(destination);
}
