import { useContext, useEffect, useState } from "react";
import WavesList from "./list/WavesList";
import { AuthContext } from "../auth/Auth";
import dynamic from "next/dynamic";

enum WavesViewMode {
  CREATE = "CREATE",
  VIEW = "VIEW",
}

const CreateWave = dynamic(() => import("./create-wave/CreateWave"), {
  ssr: false,
});

export default function Waves() {
  const { connectedProfile, requestAuth, activeProfileProxy } =
    useContext(AuthContext);

  const [viewMode, setViewMode] = useState(WavesViewMode.CREATE);

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

  // useEffect(() => {
  //   if (!connectedProfile?.profile?.handle || activeProfileProxy) {
  //     onViewModeChange(WavesViewMode.VIEW);
  //   }
  // }, [connectedProfile, activeProfileProxy]);

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
  return <div className="tailwind-scope">{components[viewMode]}</div>;
}
