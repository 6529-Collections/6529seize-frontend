import HomePageContent from "@/components/home/HomePageContent";
import { getAppMetadata } from "@/components/providers/metadata";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import { getCanonicalNextMintNumber } from "@/components/meme-calendar/meme-calendar.helpers";
import { WALLET_AUTH_COOKIE } from "@/services/auth/auth.utils";
import { commonApiFetch } from "@/services/api/common-api";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfile } from "@/helpers/server.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import type { ApiUpcomingMemeSubscriptionStatus } from "@/generated/models/ApiUpcomingMemeSubscriptionStatus";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { jwtDecode } from "jwt-decode";

type WalletJwtPayload = {
  readonly sub?: string;
};

function getProfileKey(profile: ApiIdentity): string | null {
  return (
    profile.consolidation_key ??
    profile.wallets?.map((wallet) => wallet.wallet).join("-") ??
    null
  );
}

function getWalletAddressFromJwt(jwt: string | undefined): string | null {
  if (!jwt) {
    return null;
  }

  try {
    return jwtDecode<WalletJwtPayload>(jwt).sub?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

async function prefetchHomeSubscriptionState(queryClient: QueryClient) {
  const cookieStore = await cookies();
  const walletAuth = cookieStore.get(WALLET_AUTH_COOKIE)?.value;
  const walletAddress = getWalletAddressFromJwt(walletAuth);

  if (!walletAddress) {
    return;
  }

  const headers = await getAppCommonHeaders();
  const profile = await queryClient
    .fetchQuery<ApiIdentity>({
      queryKey: [QueryKey.PROFILE, walletAddress],
      queryFn: async () =>
        await getUserProfile({
          user: walletAddress,
          headers,
        }),
    })
    .catch(() => null);

  if (!profile?.query) {
    return;
  }

  await queryClient.prefetchQuery<ApiProfileProxy[]>({
    queryKey: [QueryKey.PROFILE_PROFILE_PROXIES, { handleOrWallet: profile.query }],
    queryFn: async () =>
      await commonApiFetch<ApiProfileProxy[]>({
        endpoint: `profiles/${profile.query}/proxies/`,
        headers,
      }),
  });

  const profileKey = getProfileKey(profile);
  const tokenId = getCanonicalNextMintNumber();
  if (!profileKey || !Number.isInteger(tokenId) || tokenId <= 0) {
    return;
  }

  await Promise.allSettled([
    queryClient.prefetchQuery<SubscriptionDetails>({
      queryKey: ["next-mint-subscription-details", profileKey],
      queryFn: async () =>
        await commonApiFetch<SubscriptionDetails>({
          endpoint: `subscriptions/consolidation/details/${profileKey}`,
          headers,
        }),
    }),
    queryClient.prefetchQuery<ApiUpcomingMemeSubscriptionStatus>({
      queryKey: ["next-mint-subscription-status", profileKey, tokenId],
      queryFn: async () =>
        await commonApiFetch<ApiUpcomingMemeSubscriptionStatus>({
          endpoint: `subscriptions/consolidation/upcoming-memes/${tokenId}/${profileKey}`,
          headers,
        }),
    }),
  ]);
}

export default async function Page() {
  const queryClient = new QueryClient();
  await prefetchHomeSubscriptionState(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="tailwind-scope tw-min-h-screen tw-bg-black">
        <HomePageContent />
      </main>
    </HydrationBoundary>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    ogImage: `${publicEnv.BASE_ENDPOINT}/6529io-banner.png`,
    twitterCard: "summary_large_image",
  });
}
