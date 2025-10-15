"use client";

import { useEffect, useContext } from "react";

import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import type { CountlessPage, Page } from "@/helpers/Types";
import type { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";

type Props = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly initialStatements: CicStatement[];
  readonly initialActivityLogParams: ActivityLogParams;
  readonly initialActivityLogData: CountlessPage<ProfileActivityLog>;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialCicGivenData: Page<RatingWithProfileInfoAndLevel>;
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCicReceivedData: Page<RatingWithProfileInfoAndLevel>;
};

export default function UserPageIdentityHydrator({
  profile,
  handleOrWallet,
  initialStatements,
  initialActivityLogParams,
  initialActivityLogData,
  initialCICGivenParams,
  initialCicGivenData,
  initialCICReceivedParams,
  initialCicReceivedData,
}: Readonly<Props>) {
  const normalizedHandle = handleOrWallet.toLowerCase();
  const { initProfileIdentityPage } = useContext(ReactQueryWrapperContext);

  useEffect(() => {
    initProfileIdentityPage({
      profile,
      activityLogs: {
        params: initialActivityLogParams,
        data: initialActivityLogData,
      },
      cicGivenToUsers: {
        params: initialCICGivenParams,
        data: initialCicGivenData,
      },
      cicReceivedFromUsers: {
        params: initialCICReceivedParams,
        data: initialCicReceivedData,
      },
      statements: {
        handleOrWallet: normalizedHandle,
        data: initialStatements,
      },
    });
  }, [
    initProfileIdentityPage,
    profile,
    initialActivityLogParams,
    initialActivityLogData,
    initialCICGivenParams,
    initialCicGivenData,
    initialCICReceivedParams,
    initialCicReceivedData,
    initialStatements,
    normalizedHandle,
  ]);

  return null;
}
