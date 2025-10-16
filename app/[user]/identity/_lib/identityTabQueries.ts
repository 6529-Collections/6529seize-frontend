import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { CicStatement, ProfileActivityLog, RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { ProfileActivityFilterTargetType, RateMatter } from "@/enums";
import { convertActivityLogParams, getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import type { CountlessPage, Page } from "@/helpers/Types";
import {
  getInitialRatersParams,
  getProfileCicRatings,
  getProfileCicStatements,
  getUserProfileActivityLogs,
} from "@/helpers/server.helpers";
import type { ProfileRatersParams } from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";

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
  readonly activityLog: CountlessPage<ProfileActivityLog>;
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

const createEmptyActivityLogPage = (): Page<ProfileActivityLog> => ({
  count: 0,
  data: [],
  page: 1,
  next: false,
});

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

const toCountlessPage = (
  page: Page<ProfileActivityLog>
): CountlessPage<ProfileActivityLog> => ({
  data: page.data,
  page: page.page,
  next: page.next,
});

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
    `identity:${normalizedHandle}:activity`,
    `identity:${normalizedHandle}:raters:given`,
    `identity:${normalizedHandle}:raters:received`,
  ],
  revalidateSeconds: IDENTITY_CACHE_REVALIDATE_SECONDS,
});

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

  const [
    statementsResult,
    activityLogsResult,
    cicGivenResult,
    cicReceivedResult,
  ] = await Promise.allSettled([
    getProfileCicStatements({
      handleOrWallet: normalizedHandle,
      headers,
    }),
    getUserProfileActivityLogs<ProfileActivityLog>({
      headers,
      params: activityLogRequestParams,
    }),
    getProfileCicRatings({
      handleOrWallet: normalizedHandle,
      headers,
      params: params.cicGivenParams,
    }),
    getProfileCicRatings({
      handleOrWallet: normalizedHandle,
      headers,
      params: params.cicReceivedParams,
    }),
  ]);

  const statementsOutcome = resolveSettledResult({
    result: statementsResult,
    key: "statements",
    fallback: () => [],
  });

  const activityLogOutcome = resolveSettledResult({
    result: activityLogsResult,
    key: "activityLog",
    fallback: createEmptyActivityLogPage,
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
    activityLogOutcome.error,
    cicGivenOutcome.error,
    cicReceivedOutcome.error,
  ].filter((error): error is IdentityTabQueryError => error !== null);

  return {
    handleOrWallet: normalizedHandle,
    params,
    data: {
      statements: statementsOutcome.data,
      activityLog: toCountlessPage(activityLogOutcome.data),
      cicGiven: cicGivenOutcome.data,
      cicReceived: cicReceivedOutcome.data,
    },
    cache: createIdentityCacheHints(normalizedHandle),
    errors,
  };
};
