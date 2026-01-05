"use client";

import { useContext, useEffect, useState } from "react";

import WavesListSearch from "./WavesListSearch";
import { AuthContext } from "@/components/auth/Auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { PlusIcon } from "@heroicons/react/24/outline";
import PrimaryButton from "@/components/utils/button/PrimaryButton";
import SecondaryButton from "@/components/utils/button/SecondaryButton";

export default function WavesListHeader({
  title = "Waves",
  identity,
  waveName,
  showCreateNewButton,
  onCreateNewWave,
  onCreateNewDirectMessage,
  setIdentity,
  setWaveName,
}: {
  readonly title?: string | undefined;
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly showCreateNewButton?: boolean | undefined;
  readonly onCreateNewWave: () => void;
  readonly onCreateNewDirectMessage: () => void;
  readonly setIdentity: (identity: string | null) => void;
  readonly setWaveName: (waveName: string | null) => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowMyWavesButton = () =>
    !!connectedProfile?.handle && !activeProfileProxy;
  const [showMyWavesButton, setShowMyWavesButton] = useState(
    getShowMyWavesButton()
  );
  useEffect(
    () => setShowMyWavesButton(getShowMyWavesButton()),
    [connectedProfile, activeProfileProxy]
  );
  return (
    <div className="tw-mt-4 md:tw-mt-8">
      <h1>{title}</h1>
      <div className="tw-mt-4 md:tw-mt-6 tw-flex tw-flex-col lg:tw-flex-row tw-w-full lg:tw-items-center tw-justify-between tw-gap-4">
        <WavesListSearch
          identity={identity}
          waveName={waveName}
          setWaveName={setWaveName}
          setIdentity={setIdentity}
        />
        <div className="tw-flex tw-gap-3 tw-items-center">
          {showMyWavesButton && (
            <SecondaryButton
              onClicked={() =>
                connectedProfile?.handle && setIdentity(connectedProfile.handle)
              }
            >
              My Waves
            </SecondaryButton>
          )}
          {showCreateNewButton && (
            <>
              <PrimaryButton
                onClicked={onCreateNewWave}
                loading={false}
                disabled={false}
              >
                <PlusIcon className="tw-w-5 tw-h-5 -tw-ml-1" />
                <span className="tw-hidden sm:tw-inline">Create </span>Wave
              </PrimaryButton>
              <PrimaryButton
                onClicked={onCreateNewDirectMessage}
                loading={false}
                disabled={false}
              >
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="tw-size-4 tw-flex-shrink-0"
                />
                <span className="tw-hidden sm:tw-inline">Create </span>DM
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
