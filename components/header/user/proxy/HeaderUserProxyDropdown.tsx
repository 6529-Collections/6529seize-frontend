"use client";

import {
  faPlugCircleMinus,
  faPlugCirclePlus,
  faPlugCircleXmark,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import HeaderUserConnectedAccounts from "../connected/HeaderUserConnectedAccounts";
import HeaderUserProxyDropdownItem from "./HeaderUserProxyDropdownItem";

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
    connectedAccounts,
    canAddConnectedAccount,
    seizeConnect,
    seizeAddConnectedAccount,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
    seizeSwitchConnectedAccount,
  } = useSeizeConnectContext();
  const availableConnectedAccounts = connectedAccounts ?? [];

  const {
    activeProfileProxy,
    setActiveProfileProxy,
    receivedProfileProxies,
    setToast,
  } = useContext(AuthContext);
  const hasProxySection =
    !!activeProfileProxy || receivedProfileProxies.length > 0;

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

  const onSelectConnectedAccount = (nextAddress: string) => {
    if (nextAddress.toLowerCase() === address?.toLowerCase()) {
      onClose();
      return;
    }
    seizeSwitchConnectedAccount(nextAddress);
    onClose();
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-fixed tw-bottom-16 tw-left-6 tw-z-[9999] tw-mb-2 tw-mt-1 tw-w-72 tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-mt-1 tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800 tw-shadow-2xl">
              <div className="tw-flow-root tw-overflow-y-auto tw-overflow-x-hidden tw-py-2">
                <div
                  role="list"
                  className="tw-flex tw-flex-col tw-gap-y-2 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-700"
                >
                  {availableConnectedAccounts.length > 0 && (
                    <div className="tw-mx-0 tw-flex tw-flex-col tw-gap-y-2 tw-px-2">
                      <HeaderUserConnectedAccounts
                        accounts={availableConnectedAccounts}
                        onSelectAccount={onSelectConnectedAccount}
                        canAddAccount={canAddConnectedAccount}
                        onAddAccount={() => {
                          seizeAddConnectedAccount();
                          onClose();
                        }}
                      />
                    </div>
                  )}
                  {hasProxySection && (
                    <div className="tw-mx-0 tw-flex tw-flex-col tw-gap-y-2 tw-px-2">
                      <p className="tw-m-0 tw-px-3 tw-pt-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                        Proxy Profile
                      </p>
                      <div className="tw-h-full">
                        <button
                          type="button"
                          className={`${
                            activeProfileProxy
                              ? "tw-bg-transparent hover:tw-bg-iron-700"
                              : "tw-bg-iron-700"
                          } tw-group tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-px-3 tw-py-2.5 tw-text-left tw-text-white tw-transition tw-duration-300 tw-ease-out focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400`}
                          onClick={() => onActivateProfileProxy(null)}
                        >
                          {profile.pfp ? (
                            <div
                              className="tw-relative tw-h-6 tw-w-6 tw-flex-none tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg"
                              title={
                                activeProfileProxy
                                  ? "Use primary profile"
                                  : "Primary profile"
                              }
                            >
                              <img
                                src={profile.pfp}
                                alt="Profile Picture"
                                className="tw-absolute tw-inset-0 tw-block tw-h-full tw-w-full tw-rounded-lg tw-bg-iron-700 tw-object-cover tw-transition tw-duration-300 tw-ease-out"
                              />
                            </div>
                          ) : (
                            <div
                              className={`${
                                !activeProfileProxy
                                  ? "tw-bg-iron-600"
                                  : "tw-bg-iron-700 group-hover:tw-bg-iron-600"
                              } tw-h-6 tw-w-6 tw-flex-none tw-flex-shrink-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out`}
                              title={
                                activeProfileProxy
                                  ? "Use primary profile"
                                  : "Primary profile"
                              }
                            ></div>
                          )}
                          <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-truncate">
                            <span className="tw-text-md tw-font-medium tw-text-white">
                              {label}
                            </span>
                            {!activeProfileProxy && (
                              <svg
                                className="tw-ml-2 tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                              >
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
                  )}
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
                        className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                      >
                        <FontAwesomeIcon
                          icon={faPlugCircleMinus}
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
                        className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                      >
                        <FontAwesomeIcon
                          icon={faPlugCirclePlus}
                          height={16}
                          width={16}
                        />
                        <span>Connect Wallet</span>
                      </button>
                    )}
                  </div>
                  <div className="tw-h-full tw-px-2 tw-pt-2">
                    <button
                      onClick={() => seizeDisconnectAndLogout()}
                      type="button"
                      aria-label="Disconnect & Logout"
                      title="Disconnect & Logout"
                      className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                    >
                      <FontAwesomeIcon
                        icon={faRightFromBracket}
                        height={16}
                        width={16}
                      />
                      <span>{isConnected && `Disconnect & `}Logout</span>
                    </button>
                    {availableConnectedAccounts.length > 1 && (
                      <button
                        onClick={() => {
                          void (async () => {
                            try {
                              await seizeDisconnectAndLogoutAll();
                              onClose();
                            } catch (error) {
                              console.error(
                                "Failed to sign out all profiles",
                                error
                              );
                              setToast({
                                message:
                                  "Failed to sign out all profiles. Please try again.",
                                type: "error",
                              });
                            }
                          })();
                        }}
                        type="button"
                        aria-label="Sign Out All Profiles"
                        title="Sign Out All Profiles"
                        className="tw-relative tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-md tw-font-medium tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-text-iron-50 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
                      >
                        <FontAwesomeIcon
                          icon={faPlugCircleXmark}
                          height={16}
                          width={16}
                        />
                        <span>Sign Out All Profiles</span>
                      </button>
                    )}
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
