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
  const { connectedProfile, requestAuth, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  const isCreateNewWave = searchParams.get(NEW_WAVE_SEARCH_PARAM);

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
    setShowCreateNewWaveButton(getShowCreateNewWaveButton());
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

  if (!showWaves) {
    return null;
  }

  return <div className="tailwind-scope">{components[viewMode]}</div>;
}
