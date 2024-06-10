import { AnimatePresence, motion } from "framer-motion";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import HeaderUserProxyDropdownItem from "./HeaderUserProxyDropdownItem";
import { disconnect } from "@wagmi/core";
import { useAccount } from "wagmi";
import { wagmiConfig } from "../../../../pages/_app";
import HeaderUserProxyDropdownChains from "./HeaderUserProxyDropdownChains";

export default function HeaderUserProxyDropdown({
  isOpen,
  profile,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly profile: IProfileAndConsolidations;
  readonly onClose: () => void;
}) {
  const { address } = useAccount();

  const { activeProfileProxy, setActiveProfileProxy, receivedProfileProxies } =
    useContext(AuthContext);

  const onActivateProfileProxy = async (profileProxy: ProfileProxy | null) => {
    await setActiveProfileProxy(profileProxy);
    onClose();
  };

  const onDisconnect = () => disconnect(wagmiConfig);

  const getLabel = (): string => {
    if (profile.profile?.handle) {
      return profile.profile.handle;
    }
    const wallet = profile?.consolidation.wallets.find(
      (w) => w.wallet.address.toLowerCase() === address?.toLocaleLowerCase()
    );
    if (wallet?.wallet?.ens) {
      return wallet.wallet.ens;
    }
    if (address) {
      return address.slice(0, 6);
    }
    throw new Error("No label found");
  };

  const [label, setLabel] = useState(getLabel());
  useEffect(() => setLabel(getLabel()), [profile, address]);

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-absolute tw-left-0 tw-z-10 tw-mt-1 tw-w-72 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}>
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-2 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <div
                  role="list"
                  className="tw-flex tw-flex-col tw-gap-y-2 tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0">
                  <div className="tw-flex tw-flex-col tw-px-2 tw-gap-y-2 tw-mx-0">
                    <div className="tw-h-full">
                      <button
                        type="button"
                        className={`${
                          activeProfileProxy
                            ? "tw-bg-transparent hover:tw-bg-iron-700"
                            : "tw-bg-iron-700"
                        } tw-group tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
                        onClick={() => onActivateProfileProxy(null)}>
                        {profile.profile?.pfp_url ? (
                          <img
                            src={profile.profile?.pfp_url}
                            alt="Profile Picture"
                            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
                          />
                        ) : (
                          <div
                            className={`${
                              !activeProfileProxy
                                ? "tw-bg-iron-600"
                                : "tw-bg-iron-700 group-hover:tw-bg-iron-600"
                            } tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}></div>
                        )}
                        <div className="tw-w-full tw-truncate tw-inline-flex tw-items-center tw-justify-between">
                          <span className="tw-text-md tw-font-medium tw-text-white">
                            {label}
                          </span>
                          {!activeProfileProxy && (
                            <svg
                              className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                    {receivedProfileProxies.map((profileProxy) => (
                      <HeaderUserProxyDropdownItem
                        key={profileProxy.id}
                        profileProxy={profileProxy}
                        activeProfileProxy={activeProfileProxy}
                        onActivateProfileProxy={onActivateProfileProxy}
                      />
                    ))}
                  </div>
                  <HeaderUserProxyDropdownChains />
                  <div className="tw-h-full tw-px-2 tw-pt-2">
                    <button
                      onClick={onDisconnect}
                      type="button"
                      aria-label="Disconnect"
                      title="Disconnect"
                      className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                      <svg
                        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M16 17L21 12M21 12L16 7M21 12H9M12 17C12 17.93 12 18.395 11.8978 18.7765C11.6204 19.8117 10.8117 20.6204 9.77646 20.8978C9.39496 21 8.92997 21 8 21H7.5C6.10218 21 5.40326 21 4.85195 20.7716C4.11687 20.4672 3.53284 19.8831 3.22836 19.1481C3 18.5967 3 17.8978 3 16.5V7.5C3 6.10217 3 5.40326 3.22836 4.85195C3.53284 4.11687 4.11687 3.53284 4.85195 3.22836C5.40326 3 6.10218 3 7.5 3H8C8.92997 3 9.39496 3 9.77646 3.10222C10.8117 3.37962 11.6204 4.18827 11.8978 5.22354C12 5.60504 12 6.07003 12 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
