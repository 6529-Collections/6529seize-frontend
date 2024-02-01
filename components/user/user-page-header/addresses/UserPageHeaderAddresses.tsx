import { useEffect, useRef, useState } from "react";
import { IProfileConsolidation } from "../../../../entities/IProfile";
import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";
import UserPageHeaderAddressesItem from "./UserPageHeaderAddressesItem";
import { areEqualAddresses, formatAddress } from "../../../../helpers/Helpers";
import { useRouter } from "next/router";

export default function UserPageHeaderAddresses({
  addresses,
  onActiveAddress,
}: {
  readonly addresses: IProfileConsolidation[];

  readonly onActiveAddress: (address: string | null) => void;
}) {
  const router = useRouter();
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

  const [title, setTitle] = useState<string>("Addresses");

  const getAddressFromQuery = (): string | null => {
    if (!router.query.address) {
      return null;
    }
    if (typeof router.query.address === "string") {
      return router.query.address.toLowerCase();
    }

    if (router.query.address.length > 0) {
      return router.query.address[0].toLowerCase();
    }
    return null;
  };

  const [activeAddress, setActiveAddress] = useState<string | null>(
    getAddressFromQuery()
  );

  useEffect(() => {
    setActiveAddress((router.query.address as string) ?? null);
  }, [router.query.address]);

  useEffect(() => {
    onActiveAddress(activeAddress);
    setIsOpen(false);
  }, [activeAddress]);

  useEffect(() => {
    if (!activeAddress) {
      setTitle("Addresses");
      return;
    }
    const address = addresses.find((item) =>
      areEqualAddresses(item.wallet.address, activeAddress)
    );

    if (!address) {
      setTitle("Addresses");
      return;
    }

    setTitle(address.wallet.ens ?? formatAddress(address.wallet.address));
  }, [activeAddress, addresses]);

  const onAddressChange = (address: string | null) => {
    if (!address || address === activeAddress) {
      setActiveAddress(null);
      const currentQuery = { ...router.query };
      delete currentQuery.address;
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );
      return;
    }
    setActiveAddress(address);
    const currentQuery = { ...router.query };
    currentQuery.address = address;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <div className="tw-relative" ref={listRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="tw-text-left tw-relative tw-block tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-py-2.5 tw-pl-3.5 tw-pr-10 tw-bg-iron-900 focus:tw-bg-transparent tw-text-iron-300 tw-font-semibold tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base sm:tw-text-sm hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
      >
        <span>{title}</span>
      </button>
      <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center -tw-mr-1 tw-pr-3.5">
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
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
            className="tw-origin-top-right tw-absolute tw-z-10 tw-right-0 tw-mt-1 tw-min-w-[18rem] tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  <li className="tw-h-full tw-flex tw-items-center tw-justify-between tw-text-white tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out">
                    <button
                      onClick={() => onAddressChange(null)}
                      className="tw-bg-transparent tw-p-0 tw-border-none tw-text-left"
                    >
                      <div className="tw-w-44 tw-truncate">
                        <span className="tw-text-sm tw-font-medium tw-text-white">
                          All
                        </span>
                        {!activeAddress && (
                          <svg
                            className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
                            viewBox="0 0 24 24"
                            fill="none"
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
                  {addresses.map((item) => (
                    <UserPageHeaderAddressesItem
                      key={item.wallet.address}
                      item={item}
                      activeAddress={activeAddress}
                      onActiveAddress={onAddressChange}
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
