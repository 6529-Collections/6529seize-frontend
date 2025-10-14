import { ActivityLogParamsConverted } from "@/components/profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { ProfileActivityLog } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import { ProfileRatersParamsOrderBy, RateMatter } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { Page } from "./Types";

export const getUserProfile = async ({
  user,
  headers,
}: {
  user: string;
  headers: Record<string, string>;
}): Promise<ApiIdentity> => {
  return await commonApiFetch<ApiIdentity>({
    endpoint: `identities/${user}`,
    headers: headers,
  });
};

export const userPageNeedsRedirect = ({
  profile,
  req,
  subroute,
}: {
  profile: ApiIdentity | null;
  req: any;
  subroute: string | null;
}): {
  redirect: {
    permanent: false;
    destination: string;
  };
  props: {};
} | null => {
  if (
    profile?.handle &&
    profile.handle.toLowerCase() !== req.query.user.toLowerCase()
  ) {
    const currentQuery = { ...req.query };
    delete currentQuery.user;
    const toQueryStringValue = (input: unknown): string | null => {
      if (input === undefined || input === null) {
        return null;
      }
      if (typeof input === "string") {
        return input;
      }
      if (
        typeof input === "number" ||
        typeof input === "boolean" ||
        typeof input === "bigint"
      ) {
        return String(input);
      }
      return null;
    };
    const queryEntries = Object.entries(currentQuery).flatMap(
      ([key, value]) => {
        if (Array.isArray(value)) {
          return value
            .map(toQueryStringValue)
            .filter((entry): entry is string => entry !== null)
            .map((entry) => [key, entry]);
        }
        const normalizedValue = toQueryStringValue(value);
        if (normalizedValue === null) {
          return [];
        }
        return [[key, normalizedValue]];
      }
    );
    const queryParamsString = new URLSearchParams(queryEntries).toString();
    const destination = subroute
      ? `/${profile.handle}/${subroute}?${queryParamsString}`
      : `/${profile.handle}?${queryParamsString}`;
    return {
      redirect: {
        permanent: false,
        destination,
      },
      props: {},
    };
  }
  return null;
};

export const getUserProfileActivityLogs = async <T = ProfileActivityLog>({
  headers,
  params,
}: {
  headers: Record<string, string>;
  params: ActivityLogParamsConverted;
}): Promise<Page<T>> => {
  try {
    return await commonApiFetch<Page<T>, ActivityLogParamsConverted>({
      endpoint: `profile-logs`,
      params,
      headers,
    });
  } catch {
    return {
      count: 0,
      page: 1,
      next: false,
      data: [],
    };
  }
};

export const getInitialRatersParams = ({
  handleOrWallet,
  given,
  matter,
}: {
  handleOrWallet: string;
  given: boolean;
  matter: RateMatter;
}): ProfileRatersParams => ({
  page: 1,
  pageSize: 7,
  given,
  matter,
  order: SortDirection.DESC,
  orderBy: ProfileRatersParamsOrderBy.RATING,
  handleOrWallet,
});
