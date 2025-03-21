import { useContext, useEffect, useState } from "react";

import WavesListSearch from "./WavesListSearch";
import { AuthContext } from "../../../auth/Auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export default function WavesListHeader({
  identity,
  waveName,
  showCreateNewButton,
  onCreateNewWave,
  onCreateNewDirectMessage,
  setIdentity,
  setWaveName,
}: {
  readonly identity: string | null;
  readonly waveName: string | null;
  readonly showCreateNewButton?: boolean;
  readonly onCreateNewWave: () => void;
  readonly onCreateNewDirectMessage: () => void;
  readonly setIdentity: (identity: string | null) => void;
  readonly setWaveName: (waveName: string | null) => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowMyWavesButton = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [showMyWavesButton, setShowMyWavesButton] = useState(
    getShowMyWavesButton()
  );
  useEffect(
    () => setShowMyWavesButton(getShowMyWavesButton()),
    [connectedProfile, activeProfileProxy]
  );
  return (
    <div className="tw-mt-4 md:tw-mt-8">
      <h1 className="tw-text-3xl md:tw-text-5xl tw-mb-0">Waves</h1>
      <div className="tw-mt-4 md:tw-mt-6 tw-flex tw-flex-col md:tw-flex-row tw-w-full md:tw-items-center tw-justify-between tw-gap-4">
        <WavesListSearch
          identity={identity}
          waveName={waveName}
          setWaveName={setWaveName}
          setIdentity={setIdentity}
        />
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          {showMyWavesButton && (
            <button
              onClick={() =>
                !!connectedProfile?.profile?.handle &&
                setIdentity(connectedProfile?.profile?.handle)
              }
              type="button"
              className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-200 tw-px-3.5 tw-py-2.5 tw-text-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out">
              My Waves
            </button>
          )}
          {showCreateNewButton && (
            <>
              <div className="tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500 tw-gap-x-1">
                <button
                  onClick={onCreateNewWave}
                  type="button"
                  className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out">
                  <svg
                    className="tw-size-5 tw-mr-1.5 -tw-ml-1.5 tw-flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Create Wave</span>
                </button>
              </div>
              <div className="tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500 tw-gap-x-1">
                <button
                  onClick={onCreateNewDirectMessage}
                  type="button"
                  className="tw-flex tw-items-center tw-whitespace-nowrap tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out">
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    className="tw-size-4 tw-mr-1.5 -tw-ml-1.5 tw-flex-shrink-0"
                  />
                  <span>Create DM</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
