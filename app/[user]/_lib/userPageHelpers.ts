export type UserRouteParams = { user: string };
export type UserSearchParams = Record<string, string | string[] | undefined>;

const PROBE_USER_SUFFIXES = [
  ".html",
  ".htm",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
] as const;

export const normalizeSearchParams = (
  params?: UserSearchParams | URLSearchParams
): UserSearchParams => {
  if (!params) {
    return {};
  }

  if (params instanceof URLSearchParams) {
    return Array.from(params.entries()).reduce((acc, [key, value]) => {
      const existing = acc[key];
      if (existing === undefined) {
        acc[key] = value;
      } else if (Array.isArray(existing)) {
        acc[key] = [...existing, value];
      } else {
        acc[key] = [existing, value];
      }
      return acc;
    }, {} as UserSearchParams);
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as UserSearchParams);
};

export const isNotFoundError = (error: unknown): boolean => {
  if (
    error === null ||
    error === undefined ||
    (typeof error !== "object" && typeof error !== "string")
  ) {
    return false;
  }

  const status =
    typeof error === "object"
      ? ((error as { status?: number | undefined }).status ??
        (error as { statusCode?: number | undefined }).statusCode ??
        (error as { response?: { status?: number | undefined } | undefined })
          .response?.status)
      : undefined;

  if (status === 404) {
    return true;
  }

  let message: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return message?.toLowerCase().includes("not found") ?? false;
};

export const isProbeLikeUserSlug = (user: string): boolean => {
  const normalized = user.trim().toLowerCase();
  return PROBE_USER_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
};
