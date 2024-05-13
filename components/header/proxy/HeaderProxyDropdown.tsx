import { AnimatePresence, motion } from "framer-motion";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";
import HeaderProxyDropdownItem from "./HeaderProxyDropdownItem";
import { IProfileAndConsolidations } from "../../../entities/IProfile";

export default function HeaderProxyDropdown({
  connectedProfile,
  receivedProfileProxies,
  activeProfileProxy,
  isOpen,
  setActiveProfileProxy,
}: {
  readonly connectedProfile: IProfileAndConsolidations;
  readonly receivedProfileProxies: ProfileProxy[];
  readonly activeProfileProxy: ProfileProxy | null;
  readonly isOpen: boolean;
  readonly setActiveProfileProxy: (profileProxy: ProfileProxy | null) => void;
}) {
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
              <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  <li className="tw-h-full">
                    <button
                      type="button"
                      className="hover:tw-bg-iron-700 tw-py-2 tw-w-full tw-h-full tw-bg-transparent tw-border-none tw-text-left tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-px-2  focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
                      onClick={() => setActiveProfileProxy(null)}
                    >
                      <div className="tw-w-44 tw-truncate">
                        <span className="tw-text-sm tw-font-medium tw-text-white">
                          {connectedProfile.profile?.handle}
                        </span>
                        {!activeProfileProxy && (
                          <svg
                            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
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
                    <HeaderProxyDropdownItem
                      key={profileProxy.id}
                      profileProxy={profileProxy}
                      activeProfileProxy={activeProfileProxy}
                      setActiveProfileProxy={setActiveProfileProxy}
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
