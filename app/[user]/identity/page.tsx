import { Suspense, cache, use } from "react";
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import UserPageIdentityHydrator from "@/components/user/identity/UserPageIdentityHydrator";
import UserPageIdentityHeader from "@/components/user/identity/header/UserPageIdentityHeader";
import UserPageIdentityStatements from "@/components/user/identity/statements/UserPageIdentityStatements";
import ProfileRatersTableWrapper from "@/components/user/utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageIdentityActivityLog from "@/components/user/identity/activity/UserPageIdentityActivityLog";
import UserPageSetUpProfileWrapper from "@/components/user/utils/set-up-profile/UserPageSetUpProfileWrapper";
import CommonSkeletonLoader from "@/components/utils/animation/CommonSkeletonLoader";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CountlessPage, Page as PageWithCount } from "@/helpers/Types";
import type {
  CicStatement,
  ProfileActivityLog,
  RatingWithProfileInfoAndLevel,
} from "@/entities/IProfile";
import {
  createIdentityTabParams,
  type IdentityTabParams,
  type IdentityRatersPage,
} from "@/app/[user]/identity/_lib/identityTabQueries";
import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import {
  getProfileCicRatings,
  getProfileCicStatements,
  getUserProfileActivityLogs,
} from "@/helpers/server.helpers";
import { withServerTiming } from "@/helpers/performance.helpers";

type IdentityTabExtraProps = {
  readonly identityHandle: string;
  readonly requestHeaders: Record<string, string>;
};

type IdentityResources = {
  readonly statementsPromise: Promise<CicStatement[]>;
  readonly cicGivenPromise: Promise<IdentityRatersPage>;
  readonly cicReceivedPromise: Promise<IdentityRatersPage>;
  readonly activityLogPromise: Promise<CountlessPage<ProfileActivityLog> | null>;
  readonly hydrationPromise: Promise<IdentityHydrationPayload>;
};

type IdentityHydrationPayload = {
  readonly statements: CicStatement[];
  readonly cicGiven: IdentityRatersPage;
  readonly cicReceived: IdentityRatersPage;
  readonly activityLog: CountlessPage<ProfileActivityLog> | null;
};

const createEmptyRatersPage = (): IdentityRatersPage => ({
  count: 0,
  data: [],
  page: 1,
  next: false,
});

const fetchStatements = cache(
  async (normalizedHandle: string, headers: Record<string, string>) =>
    await withServerTiming(
      `identity-statements:${normalizedHandle}`,
      async () =>
        await getProfileCicStatements({
          handleOrWallet: normalizedHandle,
          headers,
        })
    )
);

const fetchCicRatings = cache(
  async (
    normalizedHandle: string,
    headers: Record<string, string>,
    params: IdentityTabParams["cicGivenParams"]
  ) =>
    await withServerTiming(
      `identity-cic:${normalizedHandle}:${params.given ? "given" : "received"}`,
      async () =>
        await getProfileCicRatings({
          handleOrWallet: normalizedHandle,
          headers,
          params,
        })
    )
);

const fetchActivityLog = cache(
  async (
    normalizedHandle: string,
    headers: Record<string, string>,
    params: IdentityTabParams["activityLogParams"]
  ) =>
    await withServerTiming(
      `identity-activity:${normalizedHandle}`,
      async () => {
        const converted = convertActivityLogParams({
          params,
          disableActiveGroup: true,
        });
        return await getUserProfileActivityLogs({
          headers,
          params: converted,
        });
      }
    )
);

const createResource = <T,>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: () => T
): Promise<T> =>
  (async () => {
    try {
      return await fetcher();
    } catch (error) {
      console.warn(`[identity-tab] ${label} fetch failed`, error);
      return fallback();
    }
  })();

const createIdentityResources = ({
  normalizedHandle,
  headers,
  params,
}: {
  normalizedHandle: string;
  headers: Record<string, string>;
  params: IdentityTabParams;
}): IdentityResources => {
  const statementsPromise = createResource(
    "statements",
    () => fetchStatements(normalizedHandle, headers),
    () => []
  );

  const cicGivenPromise = createResource(
    "cicGiven",
    () => fetchCicRatings(normalizedHandle, headers, params.cicGivenParams),
    createEmptyRatersPage
  );

  const cicReceivedPromise = createResource(
    "cicReceived",
    () =>
      fetchCicRatings(normalizedHandle, headers, params.cicReceivedParams),
    createEmptyRatersPage
  );

  const activityLogPromise = createResource(
    "activityLog",
    () => fetchActivityLog(normalizedHandle, headers, params.activityLogParams),
    () => null
  );

  const hydrationPromise: Promise<IdentityHydrationPayload> = (async () => {
    const [statements, cicGiven, cicReceived, activityLog] = await Promise.all([
      statementsPromise,
      cicGivenPromise,
      cicReceivedPromise,
      activityLogPromise,
    ]);

    return {
      statements,
      cicGiven,
      cicReceived,
      activityLog,
    };
  })();

  return {
    statementsPromise,
    cicGivenPromise,
    cicReceivedPromise,
    activityLogPromise,
    hydrationPromise,
  };
};

function IdentityTabFallback(): React.JSX.Element {
  return (
    <div
      className="tailwind-scope tw-space-y-8"
      data-testid="identity-tab-fallback"
    >
      <div className="tw-space-y-4">
        <div className="tw-h-6 tw-w-48 tw-rounded tw-bg-iron-900 tw-animate-pulse" />
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 xl:tw-grid-cols-2">
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
          <CommonSkeletonLoader />
        </div>
      </div>
      <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
        <CommonSkeletonLoader />
      </div>
    </div>
  );
}

async function IdentityTabContent({
  profile,
  handleOrWallet,
  headers,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly headers: Record<string, string>;
}): Promise<React.JSX.Element> {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();
  const params = createIdentityTabParams(normalizedHandleOrWallet);

  const resources = createIdentityResources({
    normalizedHandle: normalizedHandleOrWallet,
    headers,
    params,
  });

  return (
    <>
      <Suspense fallback={null}>
        <IdentityHydratorSection
          profile={profile}
          handleOrWallet={normalizedHandleOrWallet}
          params={params}
          hydrationPromise={resources.hydrationPromise}
        />
      </Suspense>
      <IdentityContentShell
        profile={profile}
        handleOrWallet={normalizedHandleOrWallet}
        params={params}
        statementsPromise={resources.statementsPromise}
        cicGivenPromise={resources.cicGivenPromise}
        cicReceivedPromise={resources.cicReceivedPromise}
        activityLogPromise={resources.activityLogPromise}
      />
    </>
  );
}

function IdentityHydratorSection({
  profile,
  handleOrWallet,
  params,
  hydrationPromise,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly params: IdentityTabParams;
  readonly hydrationPromise: Promise<IdentityHydrationPayload>;
}): React.JSX.Element {
  const { statements, cicGiven, cicReceived, activityLog } =
    use(hydrationPromise);

  return (
    <UserPageIdentityHydrator
      profile={profile}
      handleOrWallet={handleOrWallet}
      initialStatements={statements}
      initialActivityLogParams={params.activityLogParams}
      initialActivityLogData={activityLog ?? undefined}
      initialCICGivenParams={params.cicGivenParams}
      initialCicGivenData={cicGiven}
      initialCICReceivedParams={params.cicReceivedParams}
      initialCicReceivedData={cicReceived}
    />
  );
}

function IdentityContentShell({
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

function IdentityStatementsSection({
  profile,
  handleOrWallet,
  resource,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly resource: Promise<CicStatement[]>;
}): React.JSX.Element {
  const statements = use(resource);
  return (
    <UserPageIdentityStatements
      profile={profile}
      handleOrWallet={handleOrWallet}
      initialStatements={statements}
    />
  );
}

function IdentityRatersSection({
  resource,
  initialParams,
  handleOrWallet,
}: {
  readonly resource: Promise<IdentityRatersPage>;
  readonly initialParams: IdentityTabParams["cicGivenParams"];
  readonly handleOrWallet: string;
}): React.JSX.Element {
  const ratings = use(resource);
  return (
    <ProfileRatersTableWrapper
      initialParams={initialParams}
      handleOrWallet={handleOrWallet}
      initialData={ratings as PageWithCount<RatingWithProfileInfoAndLevel>}
    />
  );
}

function IdentityActivitySection({
  resource,
  initialParams,
}: {
  readonly resource: Promise<CountlessPage<ProfileActivityLog> | null>;
  readonly initialParams: IdentityTabParams["activityLogParams"];
}): React.JSX.Element {
  const activityLog = use(resource);
  return (
    <UserPageIdentityActivityLog
      initialActivityLogParams={initialParams}
      initialActivityLogData={activityLog ?? undefined}
    />
  );
}

function StatementsSkeleton(): React.JSX.Element {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
      <CommonSkeletonLoader />
    </div>
  );
}

function RatersSkeleton({
  type,
}: {
  readonly type: "given" | "received";
}): React.JSX.Element {
  return (
    <div
      className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-flex-1 tw-p-6"
      data-testid={`identity-raters-skeleton-${type}`}
    >
      <CommonSkeletonLoader />
    </div>
  );
}

function ActivitySkeleton(): React.JSX.Element {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-rounded-xl tw-p-6">
      <CommonSkeletonLoader />
    </div>
  );
}

function IdentityTab({
  profile,
  identityHandle,
  requestHeaders,
}: {
  readonly profile: ApiIdentity;
} & IdentityTabExtraProps): React.JSX.Element {
  return (
    <div className="tailwind-scope">
      <Suspense fallback={<IdentityTabFallback />}>
        <IdentityTabContent
          profile={profile}
          handleOrWallet={identityHandle}
          headers={requestHeaders}
        />
      </Suspense>
    </div>
  );
}

const { Page, generateMetadata } = createUserTabPage<IdentityTabExtraProps>({
  subroute: "identity",
  metaLabel: "Identity",
  Tab: IdentityTab,
  prepare: async ({ profile, headers, user }) => {
    const fallbackHandleOrWallet =
      profile.handle ??
      profile.primary_wallet ??
      profile.wallets?.[0]?.wallet ??
      user;
    const normalizedHandleOrWallet = fallbackHandleOrWallet.toLowerCase();

    return {
      tabProps: {
        identityHandle: normalizedHandleOrWallet,
        requestHeaders: headers,
      },
    };
  },
});

export default Page;
export { generateMetadata, IdentityTabContent };
