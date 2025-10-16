import { ActivityLogParamsConverted } from "@/components/profile-activity/ProfileActivityLogs";
import {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import { ProfileRatersParamsOrderBy, RateMatter } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { Page } from "./Types";
import { ProfileRatersParams } from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";

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
  req: { query: Record<string, string | string[] | undefined> };
  subroute: string | null;
}): {
  redirect: {
    permanent: false;
    destination: string;
  };
  props: {};
} | null => {
  const userParam = req.query.user;
  const userValue = Array.isArray(userParam) ? userParam[0] : userParam;

  if (
    profile?.handle &&
    typeof userValue === "string" &&
    profile.handle.toLowerCase() !== userValue.toLowerCase()
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
      if (typeof input === "number") {
        return Number.isFinite(input) ? String(input) : null;
      }
      if (typeof input === "boolean" || typeof input === "bigint") {
        return String(input);
      }
      return null;
    };
    const queryEntries: Array<[string, string]> = Object.entries(currentQuery).flatMap(
      ([key, value]): Array<[string, string]> => {
        if (Array.isArray(value)) {
          const normalizedEntries = value
            .map(toQueryStringValue)
            .filter((entry): entry is string => entry !== null);
          if (normalizedEntries.length === 0) {
            return [];
          }
          // Preserve legacy comma-separated encoding so downstream consumers receive strings.
          return [[key, normalizedEntries.join(",")]];
        }
        const normalizedValue = toQueryStringValue(value);
        if (normalizedValue === null) {
          return [];
        }
        return [[key, normalizedValue]];
      }
    );
    const queryParamsString = new URLSearchParams(queryEntries).toString();
    const encodedHandle = encodeURIComponent(profile.handle);
    const basePath = subroute ? `/${encodedHandle}/${subroute}` : `/${encodedHandle}`;
    const destination = queryParamsString ? `${basePath}?${queryParamsString}` : basePath;
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

export const getProfileCicStatements = async ({
  handleOrWallet,
  headers,
}: {
  handleOrWallet: string;
  headers: Record<string, string>;
}): Promise<CicStatement[]> => {
  return await commonApiFetch<CicStatement[]>({
    endpoint: `profiles/${handleOrWallet}/cic/statements`,
    headers,
  });
};

export const getProfileCicRatings = async ({
  handleOrWallet,
  headers,
  params,
}: {
  handleOrWallet: string;
  headers: Record<string, string>;
  params: {
    page: number;
    pageSize: number;
    given: boolean;
    order: SortDirection;
    orderBy: ProfileRatersParamsOrderBy;
  };
}): Promise<Page<RatingWithProfileInfoAndLevel>> => {
  const { page, pageSize, given, order, orderBy } = params;
  return await commonApiFetch<Page<RatingWithProfileInfoAndLevel>>({
    endpoint: `profiles/${handleOrWallet}/cic/ratings/by-rater`,
    params: {
      page: `${page}`,
      page_size: `${pageSize}`,
      order,
      order_by: orderBy.toLowerCase(),
      given: given ? "true" : "false",
    },
    headers,
  });
};
