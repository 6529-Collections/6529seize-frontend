import { AnimatePresence, motion } from "framer-motion";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { useContext } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import HeaderUserProxyDropdownItem from "./HeaderUserProxyDropdownItem";

export default function HeaderUserProxyDropdown({
  isOpen,
  profile,
  onClose,
}: {
  readonly isOpen: boolean;
  readonly profile: IProfileAndConsolidations;
  readonly onClose: () => void;
}) {
  const { activeProfileProxy, setActiveProfileProxy, receivedProfileProxies } =
    useContext(AuthContext);

  const onActivateProfileProxy = (profileProxy: ProfileProxy | null) => {
    setActiveProfileProxy(profileProxy);
    onClose();
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-absolute tw-right-0 tw-z-10 tw-mt-1 tw-w-56 tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-2 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-gap-y-2 tw-mx-0 tw-mb-0 tw-list-none">
                  <li className="tw-h-full">
                    <button
                      type="button"
                      className="hover:tw-bg-iron-700 tw-py-2.5 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-3 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      onClick={() => onActivateProfileProxy(null)}
                    >
                      <img
                        src=""
                        alt="Profile Picture"
                        className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
                      />
                      <div className="tw-w-44 tw-truncate tw-inline-flex tw-items-center tw-justify-between">
                        <span className="tw-text-md tw-font-medium tw-text-white">
                          {profile.profile?.handle}
                          <span className="tw-ml-2 tw-italic tw-text-sm tw-text-iron-400 tw-font-normal">
                            Proxy
                          </span>
                        </span>
                        {!activeProfileProxy && (
                          <svg
                            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out"
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
                  </li>
                  {receivedProfileProxies.map((profileProxy) => (
                    <HeaderUserProxyDropdownItem
                      key={profileProxy.id}
                      profileProxy={profileProxy}
                      activeProfileProxy={activeProfileProxy}
                      onActivateProfileProxy={onActivateProfileProxy}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
