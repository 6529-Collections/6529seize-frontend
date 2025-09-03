"use client";

import { useAuth } from "@/components/auth/Auth";
import HeaderUserConnect from "@/components/header/user/HeaderUserConnect";
import UserSetUpProfileCta from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import { useSetTitle } from "@/contexts/TitleContext";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, type JSX } from "react";
import CreateDirectMessage from "./create-dm/CreateDirectMessage";
import CreateWave from "./create-wave/CreateWave";
import WavesList from "./list/WavesList";

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

  useSetTitle("Waves | Brain");

  const { connectedProfile, activeProfileProxy, showWaves, fetchingProfile } =
    useAuth();

  const isCreateNewWave =
    searchParams?.get(CREATE_SEARCH_PARAM) === NEW_WAVE_SEARCH_VALUE;
  const isCreateNewDirectMessage =
    searchParams?.get(CREATE_SEARCH_PARAM) === NEW_DIRECT_MESSAGE_SEARCH_VALUE;

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

  const onViewModeChange = (mode: WavesViewMode) => {
    if (mode === WavesViewMode.CREATE) {
      router.push(CREATE_WAVE_SEARCH_PATH);
    } else if (mode === WavesViewMode.CREATE_DM) {
      router.push(CREATE_DIRECT_MESSAGE_SEARCH_PATH);
    } else {
      router.push(WAVES_PATH);
    }
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
    return returnPlaceholder(
      <>
        <h1 className="tw-text-xl tw-font-bold">
          This content is only available to connected wallets.
        </h1>
        <p className="tw-text-base tw-text-gray-400">
          Connect your wallet to continue.
        </p>
        <HeaderUserConnect />
      </>
    );
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
      <CreateWave
        onBack={() => onViewModeChange(WavesViewMode.VIEW)}
        profile={connectedProfile}
      />
    ),
    [WavesViewMode.CREATE_DM]: (
      <CreateDirectMessage
        onBack={() => onViewModeChange(WavesViewMode.VIEW)}
        profile={connectedProfile}
      />
    ),
  };

  return <div className="tailwind-scope">{components[viewMode]}</div>;
}
