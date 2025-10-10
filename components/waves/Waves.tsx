"use client";

import { useAuth } from "@/components/auth/Auth";
import UserSetUpProfileCta from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import { useSetTitle } from "@/contexts/TitleContext";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import CreateDirectMessage from "./create-dm/CreateDirectMessage";
import CreateWave from "./create-wave/CreateWave";
import WavesList from "./list/WavesList";
import ConnectWallet from "@/components/common/ConnectWallet";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import CreateWaveModal from "./create-wave/CreateWaveModal";
import CreateDirectMessageModal from "./create-dm/CreateDirectMessageModal";

enum WavesViewMode {
  CREATE = "CREATE",
  CREATE_DM = "CREATE_DM",
  VIEW = "VIEW",
}

const CREATE_SEARCH_PARAM = "create";
const NEW_WAVE_SEARCH_VALUE = "wave";
const NEW_DIRECT_MESSAGE_SEARCH_VALUE = "dm";

const WAVES_PATH = "/waves";
export const CREATE_WAVE_SEARCH_PATH = `${WAVES_PATH}?${CREATE_SEARCH_PARAM}=${NEW_WAVE_SEARCH_VALUE}`;
export const CREATE_DIRECT_MESSAGE_SEARCH_PATH = `${WAVES_PATH}?${CREATE_SEARCH_PARAM}=${NEW_DIRECT_MESSAGE_SEARCH_VALUE}`;

export default function Waves() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isApp } = useDeviceInfo();
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCreateDmModalOpen, setIsCreateDmModalOpen] = useState(false);

  useSetTitle("Waves | Brain");

  const { connectedProfile, activeProfileProxy, showWaves, fetchingProfile } =
    useAuth();

  const isCreateNewWave =
    searchParams?.get(CREATE_SEARCH_PARAM) === NEW_WAVE_SEARCH_VALUE;
  const isCreateNewDirectMessage =
    searchParams?.get(CREATE_SEARCH_PARAM) === NEW_DIRECT_MESSAGE_SEARCH_VALUE;

  useEffect(() => {
    if (isApp) {
      return;
    }
    if (isCreateNewWave) {
      setIsCreateWaveModalOpen(true);
      setIsCreateDmModalOpen(false);
    } else if (isCreateNewDirectMessage) {
      setIsCreateDmModalOpen(true);
      setIsCreateWaveModalOpen(false);
    } else {
      setIsCreateWaveModalOpen(false);
      setIsCreateDmModalOpen(false);
    }
  }, [isApp, isCreateNewWave, isCreateNewDirectMessage]);

  const viewMode = useMemo(() => {
    if (isCreateNewWave) {
      return WavesViewMode.CREATE;
    }
    if (isCreateNewDirectMessage) {
      return WavesViewMode.CREATE_DM;
    }
    return WavesViewMode.VIEW;
  }, [isCreateNewWave, isCreateNewDirectMessage]);

  const showCreateNewButton = useMemo(
    () => !!connectedProfile?.handle && !activeProfileProxy,
    [connectedProfile, activeProfileProxy]
  );

  const updateCreateQuery = useCallback(
    (value: "wave" | "dm" | null) => {
      if (isApp) {
        return;
      }
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value) {
        params.set(CREATE_SEARCH_PARAM, value);
      } else {
        params.delete(CREATE_SEARCH_PARAM);
      }
      const basePath = "/discover";
      const query = params.toString();
      const destination = query ? `${basePath}?${query}` : basePath;
      router.replace(destination, { scroll: false });
    },
    [isApp, router, searchParams]
  );

  const closeCreateWaveModal = useCallback(() => {
    setIsCreateWaveModalOpen(false);
    updateCreateQuery(null);
  }, [updateCreateQuery]);

  const closeCreateDmModal = useCallback(() => {
    setIsCreateDmModalOpen(false);
    updateCreateQuery(null);
  }, [updateCreateQuery]);

  const onViewModeChange = (mode: WavesViewMode) => {
    if (mode === WavesViewMode.CREATE) {
      if (isApp) {
        router.push("/waves/create");
        return;
      }
      setIsCreateWaveModalOpen(true);
      setIsCreateDmModalOpen(false);
      updateCreateQuery("wave");
      return;
    }
    if (mode === WavesViewMode.CREATE_DM) {
      if (isApp) {
        router.push("/messages/create");
        return;
      }
      setIsCreateDmModalOpen(true);
      setIsCreateWaveModalOpen(false);
      updateCreateQuery("dm");
      return;
    }
    if (isApp) {
      router.push(getWavesBaseRoute(true));
    } else {
      closeCreateWaveModal();
      closeCreateDmModal();
    }
  };

  useEffect(() => {
    if (
      isApp ||
      (!isCreateNewWave && !isCreateNewDirectMessage) ||
      pathname === "/discover"
    ) {
      return;
    }
    updateCreateQuery(isCreateNewWave ? "wave" : "dm");
  }, [
    isApp,
    isCreateNewWave,
    isCreateNewDirectMessage,
    pathname,
    updateCreateQuery,
  ]);

  const handleViewReset = () => {
    if (isApp) {
      router.push(getWavesBaseRoute(true));
      return;
    }
    setIsCreateWaveModalOpen(false);
    setIsCreateDmModalOpen(false);
    updateCreateQuery(null);
  };

  const returnPlaceholder = (content: JSX.Element) => {
    return (
      <div
        id="waves-placeholder"
        className="tw-flex-1 tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-min-h-[80dvh] tw-p-6"
      >
        <Image
          unoptimized
          priority
          loading="eager"
          src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
          alt="Brain"
          width={304}
          height={450}
          className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
        />
        <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
          {content}
        </div>
      </div>
    );
  };

  if (fetchingProfile) {
    return returnPlaceholder(
      <h1 className="tw-text-xl tw-font-bold">Loading...</h1>
    );
  } else if (activeProfileProxy) {
    return returnPlaceholder(
      <h1 className="tw-text-xl tw-font-bold">
        This content is not available to proxies.
      </h1>
    );
  } else if (!connectedProfile) {
    return <ConnectWallet />;
  } else if (!connectedProfile?.handle) {
    return returnPlaceholder(
      <>
        <h1 className="tw-text-xl tw-font-bold">
          You need to set up a profile to continue.
        </h1>
        <UserSetUpProfileCta />
      </>
    );
  } else if (!showWaves) {
    return returnPlaceholder(
      <h1 className="tw-text-xl tw-font-bold">
        This content is not available.
      </h1>
    );
  }

  const components: Record<WavesViewMode, JSX.Element> = {
    [WavesViewMode.VIEW]: (
      <WavesList
        onCreateNewWave={() => onViewModeChange(WavesViewMode.CREATE)}
        onCreateNewDirectMessage={() =>
          onViewModeChange(WavesViewMode.CREATE_DM)
        }
        showCreateNewButton={showCreateNewButton}
      />
    ),
    [WavesViewMode.CREATE]: (
      <CreateWave onBack={handleViewReset} profile={connectedProfile} />
    ),
    [WavesViewMode.CREATE_DM]: (
      <CreateDirectMessage
        onBack={handleViewReset}
        profile={connectedProfile}
      />
    ),
  };

  const activeView = isApp ? viewMode : WavesViewMode.VIEW;

  return (
    <div className="tailwind-scope">
      {components[activeView]}

      {!isApp && connectedProfile && (
        <>
          <CreateWaveModal
            isOpen={isCreateWaveModalOpen}
            onClose={handleViewReset}
            profile={connectedProfile}
          />
          <CreateDirectMessageModal
            isOpen={isCreateDmModalOpen}
            onClose={handleViewReset}
            profile={connectedProfile}
          />
        </>
      )}
    </div>
  );
}
