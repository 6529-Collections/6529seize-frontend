import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import { ProfileActivityFilterTargetType, RateMatter } from "@/enums";
import { convertActivityLogParams, getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import type { CountlessPage, Page } from "@/helpers/Types";
import {
  getInitialRatersParams,
  getProfileCicRatings,
  getProfileCicStatements,
} from "@/helpers/server.helpers";
import type { ProfileRatersParams } from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { publicEnv } from "@/config/env";

type IdentityRatersPage = Page<RatingWithProfileInfoAndLevel>;

export type IdentityTabParams = {
  readonly activityLogParams: ActivityLogParams;
  readonly cicGivenParams: ProfileRatersParams;
  readonly cicReceivedParams: ProfileRatersParams;
};

type IdentityTabDatasetKey =
  | "statements"
  | "activityLog"
  | "cicGiven"
  | "cicReceived";

export type IdentityTabServerData = {
  readonly statements: CicStatement[];
  readonly activityLog: CountlessPage<ProfileActivityLog> | null;
  readonly cicGiven: IdentityRatersPage;
  readonly cicReceived: IdentityRatersPage;
};

export type IdentityTabQueryResult = {
  readonly handleOrWallet: string;
  readonly params: IdentityTabParams;
  readonly data: IdentityTabServerData;
  readonly cache: IdentityTabCacheHints;
  readonly errors: IdentityTabQueryError[];
};

const MATTER_TYPE = RateMatter.NIC;

export type IdentityTabQueryError = {
  readonly key: IdentityTabDatasetKey;
  readonly error: unknown;
};

export type IdentityTabCacheHints = {
  readonly tags: string[];
  readonly revalidateSeconds: number;
};

const IDENTITY_CACHE_REVALIDATE_SECONDS = 60;

const createEmptyRatersPage = (): IdentityRatersPage => ({
  count: 0,
  data: [],
  page: 1,
  next: false,
});

export const createIdentityTabParams = (
  handleOrWallet: string
): IdentityTabParams => {
  const normalizedHandle = handleOrWallet.toLowerCase();

  const cicGivenParams = getInitialRatersParams({
    handleOrWallet: normalizedHandle,
    matter: MATTER_TYPE,
    given: false,
  });

  const cicReceivedParams = getInitialRatersParams({
    handleOrWallet: normalizedHandle,
    matter: MATTER_TYPE,
    given: true,
  });

  const activityLogParams: ActivityLogParams = {
    page: 1,
    pageSize: 10,
    logTypes: getProfileLogTypes({
      logTypes: [],
    }),
    matter: null,
    targetType: ProfileActivityFilterTargetType.ALL,
    handleOrWallet: normalizedHandle,
    groupId: null,
  };

  return {
    activityLogParams,
    cicGivenParams,
    cicReceivedParams,
  };
};

const resolveSettledResult = <T>({
  result,
  key,
  fallback,
}: {
  result: PromiseSettledResult<T>;
  key: IdentityTabDatasetKey;
  fallback: () => T;
}): {
  data: T;
  error: IdentityTabQueryError | null;
} => {
  if (result.status === "fulfilled") {
    return {
      data: result.value,
      error: null,
    };
  }

  return {
    data: fallback(),
    error: {
      key,
      error:
        (result.reason as unknown) ??
        new Error(`identity tab ${key} request rejected`),
    },
  };
};

const createIdentityCacheHints = (
  normalizedHandle: string
): IdentityTabCacheHints => ({
  tags: [
    `identity:${normalizedHandle}`,
    `identity:${normalizedHandle}:statements`,
    `identity:${normalizedHandle}:raters:given`,
    `identity:${normalizedHandle}:raters:received`,
  ],
  revalidateSeconds: IDENTITY_CACHE_REVALIDATE_SECONDS,
});

const logIdentityFetch = async <T>({
  handle,
  key,
  fetcher,
  describeRequest,
}: {
  handle: string;
  key: IdentityTabDatasetKey;
  fetcher: () => Promise<T>;
  describeRequest?: () => string;
}): Promise<T> => {
  if (describeRequest) {
    console.info(
      `[identity][fetch] ${key} for ${handle} request -> ${describeRequest()}`
    );
  }
  const startedAt = Date.now();
  try {
    const result = await fetcher();
    console.info(
      `[identity][fetch] ${key} for ${handle} succeeded in ${
        Date.now() - startedAt
      }ms`
    );
    return result;
  } catch (error) {
    console.error(
      `[identity][fetch] ${key} for ${handle} failed in ${
        Date.now() - startedAt
      }ms`,
      error
    );
    throw error;
  }
};

const createApiRequestUrl = ({
  endpoint,
  params,
}: {
  endpoint: string;
  params?: Record<string, string | undefined>;
}): string => {
  const baseUrl = `${publicEnv.API_ENDPOINT}/api/${endpoint}`;
  if (!params) {
    return baseUrl;
  }

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const normalizedValue = value === "nic" ? "cic" : value;
    queryParams.set(key, normalizedValue);
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

export const fetchIdentityTabData = async ({
  handleOrWallet,
  headers,
}: {
  handleOrWallet: string;
  headers: Record<string, string>;
}): Promise<IdentityTabQueryResult> => {
  const normalizedHandle = handleOrWallet.toLowerCase();
  const params = createIdentityTabParams(normalizedHandle);

  const activityLogRequestParams = convertActivityLogParams({
    params: params.activityLogParams,
    disableActiveGroup: true,
  });

  const activityLogRequestUrl = createApiRequestUrl({
    endpoint: "profile-logs",
    params: activityLogRequestParams,
  });

  console.info(
    `[identity][fetch] activityLog for ${normalizedHandle} skipped (client fetch) -> ${activityLogRequestUrl}`
  );

  const [statementsResult, cicGivenResult, cicReceivedResult] =
    await Promise.allSettled([
      logIdentityFetch({
        handle: normalizedHandle,
        key: "statements",
        fetcher: () =>
          getProfileCicStatements({
            handleOrWallet: normalizedHandle,
            headers,
          }),
    }),
    logIdentityFetch({
      handle: normalizedHandle,
      key: "cicGiven",
      fetcher: () =>
        getProfileCicRatings({
          handleOrWallet: normalizedHandle,
          headers,
          params: params.cicGivenParams,
        }),
    }),
    logIdentityFetch({
      handle: normalizedHandle,
      key: "cicReceived",
      fetcher: () =>
        getProfileCicRatings({
          handleOrWallet: normalizedHandle,
          headers,
          params: params.cicReceivedParams,
        }),
    }),
  ]);

  const statementsOutcome = resolveSettledResult({
    result: statementsResult,
    key: "statements",
    fallback: () => [],
  });

  const cicGivenOutcome = resolveSettledResult({
    result: cicGivenResult,
    key: "cicGiven",
    fallback: createEmptyRatersPage,
  });

  const cicReceivedOutcome = resolveSettledResult({
    result: cicReceivedResult,
    key: "cicReceived",
    fallback: createEmptyRatersPage,
  });

  const errors = [
    statementsOutcome.error,
    cicGivenOutcome.error,
    cicReceivedOutcome.error,
  ].filter((error): error is IdentityTabQueryError => error !== null);

  return {
    handleOrWallet: normalizedHandle,
    params,
    data: {
      statements: statementsOutcome.data,
      activityLog: null,
      cicGiven: cicGivenOutcome.data,
      cicReceived: cicReceivedOutcome.data,
    },
    cache: createIdentityCacheHints(normalizedHandle),
    errors,
  };
};
