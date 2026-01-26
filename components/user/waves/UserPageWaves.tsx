"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import WaveItem from "@/components/waves/list/WaveItem";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useWaves } from "@/hooks/useWaves";
import { useContext, useEffect, useState } from "react";
import UserPageWavesSearch from "./UserPageWavesSearch";

export default function UserPageWaves({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const haveProfile = !!profile.handle;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const getShowCreateNewWaveButton = () => {
    return (
      !!connectedProfile?.handle &&
      !activeProfileProxy &&
      connectedProfile.handle === profile.handle
    );
  };
  const [showCreateNewWaveButton, setShowCreateNewWaveButton] = useState(
    getShowCreateNewWaveButton()
  );

  useEffect(() => {
    setShowCreateNewWaveButton(getShowCreateNewWaveButton());
  }, [connectedProfile, profile, activeProfileProxy]);

  const [waveName, setWaveName] = useState<string | null>(null);

  const {
    waves,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useWaves({
    identity: profile.handle ?? null,
    waveName,
    enabled: haveProfile,
    directMessage: false,
  });

  const onBottomIntersection = (state: boolean) => {
    if (
      !state ||
      status === "pending" ||
      isFetching ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return;
    }
    void fetchNextPage().catch(() => {
      // Error surfaced via query state
    });
  };

  return (
    <div>
      <UserPageWavesSearch
        waveName={waveName}
        showCreateNewWaveButton={showCreateNewWaveButton}
        setWaveName={setWaveName}
      />
      <div className="tw-overflow-hidden">
        <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-x-4 tw-gap-y-3 md:tw-grid-cols-2 xl:tw-grid-cols-3">
          {waves.map((wave) => (
            <WaveItem key={`waves-${wave.id}`} wave={wave} />
          ))}
        </div>
        {isFetching && (
          <div className="tw-mt-8 tw-w-full tw-text-center">
            <CircleLoader size={CircleLoaderSize.XXLARGE} />
          </div>
        )}
        <CommonIntersectionElement onIntersection={onBottomIntersection} />
      </div>
    </div>
  );
}
