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
};

const MATTER_TYPE = RateMatter.NIC;

const createEmptyActivityLog = (): CountlessPage<ProfileActivityLog> => ({
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

  const statements: CicStatement[] =
    statementsResult.status === "fulfilled"
      ? statementsResult.value
      : [];

  const activityLogPage: CountlessPage<ProfileActivityLog> =
    activityLogsResult.status === "fulfilled"
      ? toCountlessPage(activityLogsResult.value)
      : createEmptyActivityLog();

  const cicGiven: IdentityRatersPage =
    cicGivenResult.status === "fulfilled"
      ? cicGivenResult.value
      : createEmptyRatersPage();

  const cicReceived: IdentityRatersPage =
    cicReceivedResult.status === "fulfilled"
      ? cicReceivedResult.value
      : createEmptyRatersPage();

  return {
    handleOrWallet: normalizedHandle,
    params,
    data: {
      statements,
      activityLog: activityLogPage,
      cicGiven,
      cicReceived,
    },
  };
};
