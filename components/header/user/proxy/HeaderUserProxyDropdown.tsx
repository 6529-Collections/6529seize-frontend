"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ApiProfileProxy } from "../../../../generated/models/ApiProfileProxy";
import HeaderUserProxyDropdownItem from "./HeaderUserProxyDropdownItem";
import HeaderUserProxyDropdownChains from "./HeaderUserProxyDropdownChains";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDoorOpen,
  faRepeat,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";

export default function HeaderUserProxyDropdown({
  isOpen,
  profile,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly profile: ApiIdentity;
  readonly onClose: () => void;
}) {
  const {
    address,
    isConnected,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
  } = useSeizeConnectContext();

  const { activeProfileProxy, setActiveProfileProxy, receivedProfileProxies } =
    useContext(AuthContext);

  const onActivateProfileProxy = async (
    profileProxy: ApiProfileProxy | null
  ) => {
    await setActiveProfileProxy(profileProxy);
    onClose();
  };

  const getLabel = (): string => {
    if (profile.handle) {
      return profile.handle;
    }
    const wallet = profile?.wallets?.find(
      (w) => w.wallet.toLowerCase() === address?.toLocaleLowerCase()
    );
    if (wallet?.display) {
      return wallet.display;
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
                        {profile.pfp ? (
                          <img
                            src={profile.pfp}
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
                  <HeaderUserProxyDropdownChains onSwitchChain={onClose} />
                  <div className="tw-h-full tw-px-2 tw-pt-2">
                    {isConnected ? (
                      <button
                        onClick={() => {
                          seizeDisconnect();
                          onClose();
                        }}
                        type="button"
                        aria-label="Disconnect"
                        title="Disconnect"
                        className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                        <FontAwesomeIcon
                          icon={faDoorOpen}
                          height={16}
                          width={16}
                        />
                        <span>Disconnect Wallet</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          seizeConnect();
                          onClose();
                        }}
                        type="button"
                        aria-label="Connect"
                        title="Connect"
                        className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                        <FontAwesomeIcon
                          icon={faDoorOpen}
                          height={16}
                          width={16}
                        />
                        <span>Connect Wallet</span>
                      </button>
                    )}
                  </div>
                  <div className="tw-h-full tw-px-2 tw-pt-2">
                    <button
                      onClick={() => seizeDisconnectAndLogout(true)}
                      type="button"
                      aria-label="Switch Account"
                      title="Switch Account"
                      className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                      <FontAwesomeIcon icon={faRepeat} height={16} width={16} />
                      <span>Switch Account</span>
                    </button>
                    <button
                      onClick={() => seizeDisconnectAndLogout()}
                      type="button"
                      aria-label="Disconnect & Logout"
                      title="Disconnect & Logout"
                      className="tw-bg-transparent hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-border-none tw-text-md tw-font-medium tw-text-left tw-flex tw-items-center tw-gap-x-3 tw-text-iron-300 hover:tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        height={16}
                        width={16}
                      />
                      <span>{isConnected && `Disconnect & `}Logout</span>
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
