import { Listbox, Transition } from "@headlessui/react";
import { useState, Fragment } from "react";
import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import CommonProfileSearch from "../../../../../utils/input/profile-search/CommonProfileSearch";

export default function ProxyCreateTargetSearch({
  onTargetSelect,
}: {
  readonly onTargetSelect: (target: CommunityMemberMinimal | null) => void;
}) {
  const people = [
    { id: 1, name: "Wade Cooper" },
    { id: 2, name: "Arlene Mccoy" },
    { id: 3, name: "Devon Webb" },
    { id: 4, name: "Tom Cook" },
    { id: 5, name: "Tanya Fox" },
    { id: 6, name: "Hellen Schmidt" },
    { id: 7, name: "Caroline Schultz" },
    { id: 8, name: "Mason Heaney" },
    { id: 9, name: "Claudie Smitham" },
    { id: 10, name: "Emil Schaefer" },
  ];
  const [selected, setSelected] = useState(people[3]);
  function classNames(...classes: any) {
    return classes.filter(Boolean).join(" ");
  }
  return (
    <div className="tw-grid tw-grid-cols-3 tw-gap-4">
      <div className="tw-col-span-1">
        {/*  <CommonProfileSearch
        value=""
        placeholder="User"
        onProfileSelect={onTargetSelect}
      /> */}

        <Listbox value={selected} onChange={setSelected}>
          {({ open }) => (
            <>
              <div className="tw-relative">
                <Listbox.Button
                  className="tw-relative tw-w-full tw-cursor-default tw-rounded-md tw-bg-iron-900 tw-py-2 tw-pl-3 tw-pr-10 tw-text-left tw-text-iron-50 tw-border-none tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 
                hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-primary-400 sm:tw-text-sm sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                >
                  <span className="tw-block tw-truncate">{selected.name}</span>
                  <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-2">
                    <svg
                      className="tw-h-5 tw-w-5 tw-text-iron-200"
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
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="tw-list-none tw-pl-0 tw-absolute tw-z-10 tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-lg tw-bg-iron-800 tw-py-1 tw-text-base tw-shadow-lg tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none sm:tw-text-sm tw-transition tw-duration-300 tw-ease-out">
                    {people.map((person) => (
                      <Listbox.Option
                        key={person.id}
                        className={({ active }) =>
                          classNames(
                            active
                              ? "tw-bg-primary-400 tw-text-white"
                              : "tw-text-iron-200",
                            "tw-relative tw-cursor-pointer tw-select-none tw-py-2 tw-pl-8 tw-pr-4 tw-transition tw-duration-300 tw-ease-out"
                          )
                        }
                        value={person}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={classNames(
                                selected
                                  ? "tw-font-semibold"
                                  : "tw-font-normal",
                                "tw-block tw-truncate"
                              )}
                            >
                              {person.name}
                            </span>

                            {selected ? (
                              <span
                                className={classNames(
                                  active
                                    ? "tw-text-white"
                                    : "tw-text-primary-400",
                                  "tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-1.5"
                                )}
                              >
                                <svg
                                  className="tw-w-5 tw-h-5"
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
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </>
          )}
        </Listbox>
      </div>
    </div>
  );
}
