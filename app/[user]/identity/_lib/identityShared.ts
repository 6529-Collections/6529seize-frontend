import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { RateMatter, ProfileActivityFilterTargetType } from "@/enums";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import { getInitialRatersParams } from "@/helpers/server.helpers";
import type { CountlessPage, Page as PageWithCount } from "@/helpers/Types";
import type {
  CicStatement,
  ProfileActivityLog,
} from "@/entities/IProfile";
import type { ProfileRatersParams } from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";

export type IdentityRatersPage = PageWithCount<RatingWithProfileInfoAndLevel>;

export type IdentityTabParams = {
  readonly activityLogParams: ActivityLogParams;
  readonly cicGivenParams: ProfileRatersParams;
  readonly cicReceivedParams: ProfileRatersParams;
};

export type IdentityHydrationPayload = {
  readonly statements: CicStatement[];
  readonly cicGiven: IdentityRatersPage;
  readonly cicReceived: IdentityRatersPage;
  readonly activityLog: CountlessPage<ProfileActivityLog> | null;
};

const MATTER_TYPE = RateMatter.NIC;

export const createIdentityTabParams = (
  handleOrWallet: string
): IdentityTabParams => {
  const normalizedHandle = handleOrWallet.toLowerCase();

  const cicGivenParams = getInitialRatersParams({
    handleOrWallet: normalizedHandle,
    matter: MATTER_TYPE,
    given: true,
  });

  const cicReceivedParams = getInitialRatersParams({
    handleOrWallet: normalizedHandle,
    matter: MATTER_TYPE,
    given: false,
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
