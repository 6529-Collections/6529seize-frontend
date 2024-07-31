import { Wave } from "../../../generated/models/Wave";
import WaveCreateDrop from "./drop/WaveCreateDrop";
import WaveDescriptionDrop from "./drops/WaveDescriptionDrop";
import WaveDrops from "./drops/WaveDrops";
import WaveHeader from "./header/WaveHeader";
import WaveLeaderboard from "./leaderboard/WaveLeaderboard";
import WaveOutcomes from "./outcome/WaveOutcomes";
import WaveSpecs from "./specs/WaveSpecs";
import WaveGroups from "./groups/WaveGroups";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRateResponse } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { useSearchParams } from "next/navigation";
import WaveSingleDrop from "./drops/WaveSingleDrop";
import { useRouter } from "next/router";

export default function WaveDetailed({ wave }: { readonly wave: Wave }) {
  const { connectedProfile, activeProfileProxy, showWaves } =
    useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const getActiveDropId = (): string | null => {
    const dropId = searchParams.get("drop");
    return dropId ?? null;
  };

  const [activeDropId, setActiveDropId] = useState<string | null>(
    getActiveDropId()
  );
  useEffect(() => setActiveDropId(getActiveDropId()), [searchParams]);

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle && !activeProfileProxy,
    });

  const onBackToList = () => {
    const updatedQuery = { ...router.query };
    delete updatedQuery.drop;
    router.replace(
      {
        pathname: router.pathname,
        query: updatedQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = contentWrapperRef.current;

    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.top < 0) {
        container.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "center",
        });
      }
    }
  }, [activeDropId]);

  if (!showWaves) {
    return null;
  }

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen">
      <WaveHeader wave={wave} />
      <div className="tw-mt-6 md:tw-mt-12 tw-pb-16 lg:tw-pb-20 tw-max-w-5xl tw-mx-auto tw-px-4 md:tw-px-0">
        <div className="tw-flex tw-items-start tw-justify-center tw-gap-x-6">
          <div className="tw-hidden tw-flex-1 lg:tw-flex tw-flex-col tw-gap-y-4">
            <WaveSpecs wave={wave} />
            <WaveGroups wave={wave} />
            {false && (
              <>
                <WaveLeaderboard wave={wave} />
                <WaveOutcomes wave={wave} />{" "}
              </>
            )}
          </div>
          <div
            className="tw-w-[672px] tw-overflow-hidden"
            ref={contentWrapperRef}
          >
            {activeDropId ? (
              <WaveSingleDrop
                dropId={activeDropId}
                availableCredit={
                  availableRateResponse?.available_credit_for_rating ?? null
                }
                onBackToList={onBackToList}
              />
            ) : (
              <>
                <WaveCreateDrop wave={wave} />
                <WaveDescriptionDrop
                  wave={wave}
                  availableCredit={
                    availableRateResponse?.available_credit_for_rating ?? null
                  }
                />
                <WaveDrops
                  wave={wave}
                  availableCredit={
                    availableRateResponse?.available_credit_for_rating ?? null
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
