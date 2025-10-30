"use client";

import { useAuth } from "@/components/auth/Auth";
import UserSetUpProfileCta from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import { useSetTitle } from "@/contexts/TitleContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, type JSX } from "react";
import CreateDirectMessage from "./create-dm/CreateDirectMessage";
import CreateWave from "./create-wave/CreateWave";
import CreateWaveModal from "./create-wave/CreateWaveModal";
import WavesList from "./list/WavesList";
import ConnectWallet from "@/components/common/ConnectWallet";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import CreateDirectMessageModal from "./create-dm/CreateDirectMessageModal";
import useCreateModalState, {
  CREATE_DIRECT_MESSAGE_VALUE,
  CREATE_QUERY_KEY,
  CREATE_WAVE_VALUE,
} from "@/hooks/useCreateModalState";

interface WavesProps {
  readonly heading?: string;
  readonly documentTitle?: string;
}

enum WavesViewMode {
  CREATE = "CREATE",
  CREATE_DM = "CREATE_DM",
  VIEW = "VIEW",
}

const WAVES_PATH = "/waves";
export const CREATE_WAVE_SEARCH_PATH = `${WAVES_PATH}?${CREATE_QUERY_KEY}=${CREATE_WAVE_VALUE}`;
export const CREATE_DIRECT_MESSAGE_SEARCH_PATH = `${WAVES_PATH}?${CREATE_QUERY_KEY}=${CREATE_DIRECT_MESSAGE_VALUE}`;

export default function Waves({
  heading = "Waves",
  documentTitle = "Waves | Brain",
}: WavesProps = {}) {
  const router = useRouter();
  const {
    mode,
    isDirectMessageModalOpen,
    openWave,
    openDirectMessage,
    close,
    isApp,
    isWaveModalOpen,
  } = useCreateModalState();

  useSetTitle(documentTitle);

  const { connectedProfile, activeProfileProxy, showWaves, fetchingProfile } =
    useAuth();

  const viewMode = useMemo(() => {
    if (mode === CREATE_WAVE_VALUE) {
      return WavesViewMode.CREATE;
    }
    if (mode === CREATE_DIRECT_MESSAGE_VALUE) {
      return WavesViewMode.CREATE_DM;
    }
    return WavesViewMode.VIEW;
  }, [mode]);

  const showCreateNewButton = useMemo(
    () => !!connectedProfile?.handle && !activeProfileProxy,
    [connectedProfile, activeProfileProxy]
  );

  const onViewModeChange = useCallback(
    (nextMode: WavesViewMode) => {
      if (nextMode === WavesViewMode.CREATE) {
        openWave();
        return;
      }
      if (nextMode === WavesViewMode.CREATE_DM) {
        openDirectMessage();
        return;
      }
      if (isApp) {
        router.push(getWavesBaseRoute(true));
        return;
      }
      close();
    },
    [close, isApp, openDirectMessage, openWave, router]
  );

  const handleViewReset = () => {
    if (isApp) {
      router.push(getWavesBaseRoute(true));
      return;
    }
    close();
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
        heading={heading}
        onCreateNewWave={() => onViewModeChange(WavesViewMode.CREATE)}
        onCreateNewDirectMessage={() =>
          onViewModeChange(WavesViewMode.CREATE_DM)
        }
        showCreateNewButton={showCreateNewButton}
      />
    ),
    [WavesViewMode.CREATE]: (
      <CreateWave
        onBack={handleViewReset}
        onSuccess={handleViewReset}
        profile={connectedProfile}
      />
    ),
    [WavesViewMode.CREATE_DM]: (
      <CreateDirectMessage
        onBack={handleViewReset}
        onSuccess={handleViewReset}
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
            isOpen={isWaveModalOpen}
            onClose={handleViewReset}
            profile={connectedProfile}
          />
          <CreateDirectMessageModal
            isOpen={isDirectMessageModalOpen}
            onClose={handleViewReset}
            profile={connectedProfile}
          />
        </>
      )}
    </div>
  );
}
