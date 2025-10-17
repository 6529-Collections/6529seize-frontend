import { Suspense, cache } from "react";
import { createUserTabPage } from "@/app/[user]/_lib/userTabPageFactory";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { CountlessPage } from "@/helpers/Types";
import type { CicStatement, ProfileActivityLog } from "@/entities/IProfile";
import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import {
  getProfileCicRatings,
  getUserProfileActivityLogs,
} from "@/helpers/server.helpers";
import { fetchHeaderStatements } from "@/components/user/user-page-header/userPageHeaderPrefetch";
import { withServerTiming } from "@/helpers/performance.helpers";
import {
  createIdentityTabParams,
  type IdentityTabParams,
  type IdentityRatersPage,
  type IdentityHydrationPayload,
} from "@/app/[user]/identity/_lib/identityShared";
import { IdentityTabFallback } from "@/app/[user]/identity/_components/IdentitySkeletons";
import { IdentityHydratorSection } from "@/app/[user]/identity/_components/IdentityHydratorSection";
import { IdentityContentShell } from "@/app/[user]/identity/_components/IdentityContentShell";

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

const createEmptyRatersPage = (): IdentityRatersPage => ({
  count: 0,
  data: [],
  page: 1,
  next: false,
});

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
    () => fetchHeaderStatements(normalizedHandle, headers),
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
