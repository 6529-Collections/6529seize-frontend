import { Suspense } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageSetUpProfileWrapper from "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper";
import UserPageIdentityHeader from "@/components/user/identity/header/UserPageIdentityHeader";
import type {
  IdentityTabParams,
  IdentityRatersPage,
} from "@/app/[user]/identity/_lib/identityShared";
import type { CicStatement, ProfileActivityLog } from "@/entities/IProfile";
import type { CountlessPage } from "@/helpers/Types";
import {
  ActivitySkeleton,
  RatersSkeleton,
  StatementsSkeleton,
} from "@/app/[user]/identity/_components/IdentitySkeletons";
import { IdentityStatementsSection } from "@/app/[user]/identity/_components/IdentityStatementsSection";
import { IdentityRatersSection } from "@/app/[user]/identity/_components/IdentityRatersSection";
import { IdentityActivitySection } from "@/app/[user]/identity/_components/IdentityActivitySection";

export function IdentityContentShell({
  profile,
  handleOrWallet,
  params,
  statementsPromise,
  cicGivenPromise,
  cicReceivedPromise,
  activityLogPromise,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly params: IdentityTabParams;
  readonly statementsPromise: Promise<CicStatement[]>;
  readonly cicGivenPromise: Promise<IdentityRatersPage>;
  readonly cicReceivedPromise: Promise<IdentityRatersPage>;
  readonly activityLogPromise: Promise<CountlessPage<ProfileActivityLog> | null>;
}): React.JSX.Element {
  return (
    <UserPageSetUpProfileWrapper
      profile={profile}
      handleOrWallet={handleOrWallet}
    >
      <div className="tailwind-scope">
        <UserPageIdentityHeader profile={profile} />
        <Suspense fallback={<StatementsSkeleton />}>
          <IdentityStatementsSection
            profile={profile}
            handleOrWallet={handleOrWallet}
            resource={statementsPromise}
          />
        </Suspense>
        <div className="tw-mt-6 lg:tw-mt-10 xl:tw-flex xl:tw-items-stretch tw-space-y-8 lg:tw-space-y-10 xl:tw-space-y-0 tw-gap-x-8">
          <Suspense fallback={<RatersSkeleton type="given" />}>
            <IdentityRatersSection
              resource={cicGivenPromise}
              initialParams={params.cicGivenParams}
              handleOrWallet={handleOrWallet}
            />
          </Suspense>
          <Suspense fallback={<RatersSkeleton type="received" />}>
            <IdentityRatersSection
              resource={cicReceivedPromise}
              initialParams={params.cicReceivedParams}
              handleOrWallet={handleOrWallet}
            />
          </Suspense>
        </div>
        <Suspense fallback={<ActivitySkeleton />}>
          <IdentityActivitySection
            resource={activityLogPromise}
            initialParams={params.activityLogParams}
          />
        </Suspense>
      </div>
    </UserPageSetUpProfileWrapper>
  );
}
