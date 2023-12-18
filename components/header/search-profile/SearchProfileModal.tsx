import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";

export default function SearchProfileModal({
  onClose,
}: {
  readonly onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, onClose);
  useKeyPressEvent("Escape", onClose);

  const [searchValue, setSearchValue] = useState<string>("");

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(searchValue);
    },
    500,
    [searchValue]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="tw-cursor-default tw-relative tw-z-10">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-75"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-p-4 tw-text-center sm:tw-items-center sm:tw-p-0">
          <div
            ref={modalRef}
            className="sm:tw-max-w-xl tw-relative tw-w-full tw-transform tw-rounded-xl tw-bg-iron-900 tw-text-left tw-shadow-xl tw-transition-all tw-duration-500 sm:tw-w-full tw-p-6"
          >
            <div className="tw-relative">
              <svg
                className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                required
                autoComplete="off"
                value={searchValue}
                onChange={handleInputChange}
                className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-white/5 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
                placeholder="Search..."
              />
            </div>
            <div className="tw-max-h-72 tw-scroll-py-2 tw-overflow-y-auto tw-py-2 tw-text-sm tw-text-white">
              <button className="tw-cursor-default tw-select-none tw-rounded-md tw-px-4 tw-py-2">
                Leslie Alexander
              </button>
              <button className="cursor-default select-none rounded-md px-4 py-2">
                Michael Foster
              </button>
              <button className="cursor-default select-none rounded-md px-4 py-2">
                Dries Vincent
              </button>
              <button className="cursor-default select-none rounded-md px-4 py-2">
                Lindsay Walton
              </button>
              <button className="cursor-default select-none rounded-md px-4 py-2">
                Courtney Henry
              </button>
            </div>
            <p className="tw-p-4 tw-text-sm tw-text-gray-500">
              No Profiles found.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
