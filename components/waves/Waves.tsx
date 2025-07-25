"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, type JSX } from "react";
import { AuthContext } from "../auth/Auth";
import CreateDirectMessage from "./create-dm/CreateDirectMessage";
import CreateWave from "./create-wave/CreateWave";
import WavesList from "./list/WavesList";

enum WavesViewMode {
  CREATE = "CREATE",
  CREATE_DM = "CREATE_DM",
  VIEW = "VIEW",
}

const NEW_WAVE_SEARCH_PARAM = "new";
const NEW_DIRECT_MESSAGE_SEARCH_PARAM = "new-dm";

export default function Waves() {
  useSetTitle("Waves | Brain");
  const searchParams = useSearchParams();
  const { connectedProfile, requestAuth, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  const isCreateNewWave = searchParams?.get(NEW_WAVE_SEARCH_PARAM);
  const isCreateNewDirectMessage = searchParams?.get(
    NEW_DIRECT_MESSAGE_SEARCH_PARAM
  );

  const getShouldSetCreateNewWave = () =>
    isCreateNewWave && !!connectedProfile?.handle && !activeProfileProxy;

  const getShouldSetCreateNewDirectMessage = () =>
    isCreateNewDirectMessage &&
    !!connectedProfile?.handle &&
    !activeProfileProxy;

  const [viewMode, setViewMode] = useState(
    getShouldSetCreateNewWave() ? WavesViewMode.CREATE : WavesViewMode.VIEW
  );

  const getShowCreateNewButton = () =>
    !!connectedProfile?.handle && !activeProfileProxy;

  const [showCreateNewButton, setShowCreateNewButton] = useState(
    getShowCreateNewButton()
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
    if (getShouldSetCreateNewDirectMessage()) {
      onViewModeChange(WavesViewMode.CREATE_DM);
    }
  }, [isCreateNewDirectMessage]);

  useEffect(() => {
    if (!connectedProfile?.handle || activeProfileProxy) {
      onViewModeChange(WavesViewMode.VIEW);
    }
    setShowCreateNewButton(getShowCreateNewButton());
  }, [connectedProfile, activeProfileProxy]);

  if (!showWaves || !connectedProfile) {
    return null;
  }

  const components: Record<WavesViewMode, JSX.Element> = {
    [WavesViewMode.VIEW]: (
      <WavesList
        onCreateNewWave={() => setViewMode(WavesViewMode.CREATE)}
        onCreateNewDirectMessage={() => setViewMode(WavesViewMode.CREATE_DM)}
        showCreateNewButton={showCreateNewButton}
      />
    ),
    [WavesViewMode.CREATE]: (
      <CreateWave
        onBack={() => setViewMode(WavesViewMode.VIEW)}
        profile={connectedProfile}
      />
    ),
    [WavesViewMode.CREATE_DM]: (
      <CreateDirectMessage
        onBack={() => setViewMode(WavesViewMode.VIEW)}
        profile={connectedProfile}
      />
    ),
  };

  return <div className="tailwind-scope">{components[viewMode]}</div>;
}
