import { Fragment, useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserPageHeaderAddresses from "../../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import { MEMES_SEASON } from "../../../../enums";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import { ProfileCollectedFilters } from "../UserPageCollected";
import { Dialog, Transition } from "@headlessui/react";

export default function UserPageCollectedFilters({
  profile,
  filters,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: ProfileCollectedFilters;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MEMES_SEASON | null) => void;
}) {
  const getShowSeizedAndSzn = (
    targetCollection: CollectedCollectionType | null
  ): boolean => targetCollection === CollectedCollectionType.MEMES;

  const [showSeizedAndSzn, setShowSeizedAndSzn] = useState<boolean>(
    getShowSeizedAndSzn(filters.collection)
  );

  const [open, setOpen] = useState(true);

  useEffect(() => {
    setShowSeizedAndSzn(getShowSeizedAndSzn(filters.collection));
  }, [filters.collection]);

  return (
    <div className="tw-flex tw-justify-between tw-gap-y-6 tw-gap-x-4">
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-3 tw-gap-x-4">
        <button
          onClick={() => setOpen(true)}
          type="button"
          className="tw-relative tw-text-base sm:tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-3.5 tw-py-2.5 tw-text-iron-300 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-800 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-mr-2 tw-w-5 tw-h-5 tw-flex-shrink-0 tw-text-iron-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 12H18M3 6H21M9 18H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Filters</span>
        </button>

        <Transition.Root show={open} as={Fragment}>
          <Dialog
            as="div"
            className="tw-relative tw-z-50 lg:tw-hidden"
            onClose={setOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="tw-ease-in-out tw-duration-500"
              enterFrom="tw-opacity-0"
              enterTo="tw-opacity-100"
              leave="tw-ease-in-out tw-duration-500"
              leaveFrom="tw-opacity-100"
              leaveTo="tw-opacity-0"
            >
              <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75 tw-transition-opacity" />
            </Transition.Child>

            <div className="tw-fixed tw-inset-0 tw-overflow-hidden">
              <div className="tw-absolute tw-inset-0 tw-overflow-hidden">
                <div className="tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-flex tw-max-w-full tw-pt-10">
                  <Transition.Child
                    as={Fragment}
                    enter="tw-transform tw-transition tw-ease-in-out tw-duration-500 sm:tw-duration-700"
                    enterFrom="tw-translate-y-full"
                    enterTo="tw-translate-y-0"
                    leave="tw-transform tw-transition tw-ease-in-out tw-duration-500 sm:tw-duration-700"
                    leaveFrom="tw-translate-y-0"
                    leaveTo="tw-translate-y-full"
                  >
                    <Dialog.Panel className="tw-pointer-events-auto tw-relative tw-w-screen">
                      <Transition.Child
                        as={Fragment}
                        enter="tw-ease-in-out tw-duration-500"
                        enterFrom="tw-opacity-0"
                        enterTo="tw-opacity-100"
                        leave="tw-ease-in-out tw-duration-500"
                        leaveFrom="tw-opacity-100"
                        leaveTo="tw-opacity-0"
                      >
                        <div className="tw-absolute tw-right-0 -tw-top-14 -tw-ml-8 tw-flex tw-pr-2 tw-pt-4 sm:-tw-ml-10 sm:tw-pr-4">
                          <button
                            type="button"
                            title="Close panel"
                            aria-label="Close panel"
                            className="tw-p-0 tw-relative tw-bg-transparent tw-rounded-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white"
                            onClick={() => setOpen(false)}
                          >
                            <svg
                              className="tw-w-6 tw-h-6 tw-flex-shrink-0 tw-text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </Transition.Child>
                      <div className="tw-flex tw-h-full tw-flex-col tw-bg-iron-950 tw-rounded-t-lg tw-overflow-y-auto tw-py-6">
                        <div className="tw-px-4 sm:tw-px-6">
                          <Dialog.Title className="tw-text-base tw-font-semibold tw-text-iron-50">
                            Filters
                          </Dialog.Title>
                        </div>
                        <div className="tw-relative tw-mt-6 tw-flex-1 tw-px-4 sm:tw-px-6 tw-gap-y-6 tw-flex tw-flex-col">
                          <UserPageCollectedFiltersCollection
                            selected={filters.collection}
                            setSelected={setCollection}
                          />
                          <UserPageCollectedFiltersSortBy
                            selected={filters.sortBy}
                            direction={filters.sortDirection}
                            setSelected={setSortBy}
                          />

                          {showSeizedAndSzn && (
                            <>
                              <UserPageCollectedFiltersSeized
                                selected={filters.seized}
                                setSelected={setSeized}
                              />
                              <UserPageCollectedFiltersSzn
                                selected={filters.szn}
                                setSelected={setSzn}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition.Root>

        <div className="tw-hidden">
          <UserPageCollectedFiltersCollection
            selected={filters.collection}
            setSelected={setCollection}
          />
          <UserPageCollectedFiltersSortBy
            selected={filters.sortBy}
            direction={filters.sortDirection}
            setSelected={setSortBy}
          />

          {showSeizedAndSzn && (
            <>
              <UserPageCollectedFiltersSeized
                selected={filters.seized}
                setSelected={setSeized}
              />
              <UserPageCollectedFiltersSzn
                selected={filters.szn}
                setSelected={setSzn}
              />
            </>
          )}
        </div>
      </div>
      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        onActiveAddress={() => undefined}
      />
    </div>
  );
}
