import { useContext, useEffect, useState } from "react";
import WavesList from "./list/WavesList";
import { AuthContext } from "../auth/Auth";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

enum WavesViewMode {
  CREATE = "CREATE",
  VIEW = "VIEW",
}

const CreateWave = dynamic(() => import("./create-wave/CreateWave"), {
  ssr: false,
});

const NEW_WAVE_SEARCH_PARAM = "new";

export default function Waves() {
  const searchParams = useSearchParams();
  const { connectedProfile, requestAuth, activeProfileProxy } =
    useContext(AuthContext);

  const isCreateNewWave = searchParams.get(NEW_WAVE_SEARCH_PARAM);

  const getShowDrops = () =>
    !!(
      !!connectedProfile?.profile?.handle &&
      connectedProfile.level >= 50 &&
      !activeProfileProxy
    ) || connectedProfile?.profile?.handle === "simo";

  const [showDrops, setShowDrops] = useState(getShowDrops());
  useEffect(
    () => setShowDrops(getShowDrops()),
    [connectedProfile, activeProfileProxy]
  );

  const getShouldSetCreateNewWave = () =>
    isCreateNewWave &&
    !!connectedProfile?.profile?.handle &&
    !activeProfileProxy;

  const [viewMode, setViewMode] = useState(
    getShouldSetCreateNewWave() ? WavesViewMode.CREATE : WavesViewMode.VIEW
  );

  const getShowCreateNewWaveButton = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;

  const [showCreateNewWaveButton, setShowCreateNewWaveButton] = useState(
    getShowCreateNewWaveButton()
  );

  useEffect(() => {
    setShowCreateNewWaveButton(getShowCreateNewWaveButton());
  }, [connectedProfile, activeProfileProxy]);

  const onViewModeChange = async (mode: WavesViewMode): Promise<void> => {
    if (mode === WavesViewMode.CREATE) {
      const { success } = await requestAuth();
      if (!success) return;
    }
    setViewMode(mode);
  };

  useEffect(() => {
    if (getShouldSetCreateNewWave()) {
      onViewModeChange(WavesViewMode.CREATE);
    }
  }, [isCreateNewWave]);

  useEffect(() => {
    if (!connectedProfile?.profile?.handle || activeProfileProxy) {
      onViewModeChange(WavesViewMode.VIEW);
    }
  }, [connectedProfile, activeProfileProxy]);

  const components: Record<WavesViewMode, JSX.Element> = {
    [WavesViewMode.VIEW]: (
      <WavesList
        onCreateNewWave={() => setViewMode(WavesViewMode.CREATE)}
        showCreateNewWaveButton={showCreateNewWaveButton}
      />
    ),
    [WavesViewMode.CREATE]: connectedProfile ? (
      <CreateWave
        onBack={() => setViewMode(WavesViewMode.VIEW)}
        profile={connectedProfile}
      />
    ) : (
      <div></div>
    ),
  };

  if (!showDrops) {
    return null;
  }

  return <div className="tailwind-scope">{components[viewMode]}</div>;
}
