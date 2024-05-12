import { AnimatePresence, motion } from "framer-motion";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";
import HeaderProxyDropdownItem from "./HeaderProxyDropdownItem";

export default function HeaderProxyDropdown({
  receivedProfileProxies,
  activeProfileProxy,
  isOpen,
  setActiveProfileProxy,
}: {
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
