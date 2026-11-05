"use client";

import { useState, type ComponentProps } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useNowMinting } from "@/hooks/useNowMinting";
import type { NFTFinalSubscription } from "@/generated/models/NFTFinalSubscription";
import UserPageSubscriptionsUpcoming from "../../UserPageSubscriptionsUpcoming";

const CONTRACT = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const MINT_DATE = new Date("2026-11-04T00:00:00Z");
type UpcomingProps = ComponentProps<typeof UserPageSubscriptionsUpcoming>;

export default function MintingTodayPreview(props: UpcomingProps) {
  const { nft } = useNowMinting();
  const artwork =
    nft?.id === 570 ? nft.thumbnail || nft.scaled || nft.icon : undefined;
  const source = artwork || "/profile-cms/templates/memes/1.webp";
  return <MintingTodaySample key={source} {...props} artwork={source} />;
}

function MintingTodaySample({
  artwork,
  ...props
}: UpcomingProps & { readonly artwork: string }) {
  // A separate cache keeps all illustrative allocation data out of real queries.
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { enabled: false, staleTime: Infinity } },
    });
    queryClient.setQueryData([QueryKey.MEMES_LATEST], {
      id: 570,
      contract: CONTRACT,
      thumbnail: artwork,
    });
    queryClient.setQueryData<NFTFinalSubscription>(
      [
        "consolidation-final-subscription",
        `${props.profileKey}-${CONTRACT}-570`,
      ],
      {
        consolidation_key: props.profileKey,
        contract: CONTRACT,
        token_id: 570,
        subscribed_count: 12,
        airdrop_address: "0x7d88f221e9ecef9eef118e0d0e8a47f81b37e0b6",
        balance: 71.55784,
        phase: "Phase 0",
        phase_position: 8,
        phase_subscriptions: 42,
      }
    );
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>
      <UserPageSubscriptionsUpcoming
        {...props}
        referenceDate={MINT_DATE}
        loading={false}
        memes_subscriptions={[570, 571, 572, 573, 574].map((token_id) => ({
          token_id,
          contract: CONTRACT,
          consolidation_key: props.profileKey,
          subscribed: true,
          subscribed_count: 12,
        }))}
      />
    </QueryClientProvider>
  );
}
