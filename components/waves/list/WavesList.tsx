import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext, WAVES_MIN_ACCESS_LEVEL } from "../../auth/Auth";
import { WavesOverviewType } from "../../../generated/models/WavesOverviewType";
import WavesListWrapper from "./WavesListWrapper";
import WavesListHeader from "./header/WavesListHeader";
import WavesListSearchResults from "./WavesListSearchResults";

export default function WavesList({
  showCreateNewWaveButton,
  onCreateNewWave,
}: {
  readonly showCreateNewWaveButton?: boolean;
  readonly onCreateNewWave: () => void;
}) {
  const router = useRouter();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [showAllType, setShowAllType] = useState<WavesOverviewType | null>(null);

  const getWaveOverviewTypes = (): WavesOverviewType[] => {
    const types = showAllType
      ? Object.values(WavesOverviewType).filter((t) => t === showAllType)
      : Object.values(WavesOverviewType);
    if (!connectedProfile?.profile?.handle || !!activeProfileProxy) {
      return types.filter((t) => t !== WavesOverviewType.AuthorYouHaveRepped);
    }
    return types;
  };

  const [overviewTypes, setOverviewTypes] = useState(getWaveOverviewTypes());
  useEffect(
    () => setOverviewTypes(getWaveOverviewTypes()),
    [connectedProfile, activeProfileProxy, showAllType]
  );

  const [identity, setIdentity] = useState<string | null>(
    (router.query.identity as string) || null
  );
  const [waveName, setWaveName] = useState<string | null>(null);

  const updateIdentity = (newIdentity: string | null) => {
    setIdentity(newIdentity);
    const newQuery = { ...router.query };
    if (!newIdentity || newIdentity.trim() === "") {
      delete newQuery.identity;
    } else {
      newQuery.identity = newIdentity;
    }
    router.push({
      pathname: router.pathname,
      query: newQuery,
    }, undefined, { shallow: true });
  };

  const getShowSearchResults = () => !!identity || !!waveName;
  const [showSearchResults, setShowSearchResults] = useState(getShowSearchResults());

  useEffect(() => {
    setShowSearchResults(getShowSearchResults());
    setIdentity((router.query.identity as string) || null);
  }, [router.query.identity, waveName]);

  return (
    <div className="tailwind-scope">
      <div className="tw-pb-14 lg:tw-pb-24 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
        <div className="md:tw-flex tw-justify-center ">
          <div className="tw-text-iron-500 tw-text-sm tw-py-2">
            These pages are in closed alpha for level {WAVES_MIN_ACCESS_LEVEL}{" "}
            and above. They are not ready for public release. Lots of
            improvements and bugs to fix. Currently only &quot;chat&quot; waves
            are active.
          </div>
        </div>
        <WavesListHeader
          identity={identity}
          waveName={waveName}
          showCreateNewWaveButton={showCreateNewWaveButton}
          onCreateNewWave={onCreateNewWave}
          setIdentity={updateIdentity}
          setWaveName={setWaveName}
        />
        <div className="tw-mt-6">
          {showSearchResults ? (
            <WavesListSearchResults identity={identity} waveName={waveName} />
          ) : (
            <div className="tw-space-y-8">
              {overviewTypes.map((type) => (
                <WavesListWrapper
                  key={type}
                  overviewType={type}
                  showAllType={showAllType}
                  setShowAllType={setShowAllType}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
