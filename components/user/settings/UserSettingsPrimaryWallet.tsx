import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { IProfileMetaWallet } from "../../auth/Auth";
import UserSettingsPrimaryWalletItem from "./UserSettingsPrimaryWalletItem";

export default function UserSettingsPrimaryWallet({
  consolidations,
  selected,
  onSelect,
}: {
  consolidations: IProfileMetaWallet[];
  selected: string;
  onSelect: (wallet: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const toggleOpen = () => setIsOpen(!isOpen);
  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 0 });
    } else {
      animateIcon(iconScope.current, { rotate: -90 });
    }
  });
  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [title, setTitle] = useState<string>("Select wallet");
  useEffect(() => {
    setTitle(
      consolidations.find((w) => w.wallet.address === selected)?.displayName ??
        "Select wallet"
    );
  }, [selected]);

  const selectWallet = (wallet: string) => {
    onSelect(wallet);
    setIsOpen(false);
  };

  return (
    <div className="tw-max-w-full tw-relative tw-mt-2" ref={listRef}>
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-350">
        Primary wallet
      </label>
      <div className="tw-mt-2 tw-relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="tw-text-left tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-iron-900 focus:tw-bg-transparent tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/20 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 hover:tw-ring-iron-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-iron-350 tw-font-light">{title}</span>
        </button>
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3">
          <svg
            ref={iconScope}
            className="tw-h-5 tw-w-5 tw-text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-origin-top-right tw-absolute tw-z-10 tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-full tw-w-full tw-rounded-md tw-bg-iron-700 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {consolidations.map((wallet) => (
                    <UserSettingsPrimaryWalletItem
                      key={wallet.wallet.address}
                      wallet={wallet}
                      selected={selected}
                      onSelect={selectWallet}
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
