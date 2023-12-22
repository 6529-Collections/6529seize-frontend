import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";

export default function UserPageRepNewRepSearch({
  onRepSearch,
}: {
  readonly onRepSearch: (repSearch: string) => void;
}) {
  const [repSearch, setRepSearch] = useState<string>("");

  const handleRepSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value;
    setRepSearch(newValue);
  };

  const [debouncedValue, setDebouncedValue] = useState<string>("");
  useDebounce(
    () => {
      setDebouncedValue(repSearch);
    },
    500,
    [repSearch]
  );

  const { isFetching, data: categories } = useQuery<string[]>({
    queryKey: [QueryKey.REP_CATEGORIES_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: "/rep/categories",
        params: {
          param: debouncedValue,
        },
      }),
    enabled: debouncedValue.length > 2,
  });

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onRepSelect = (rep: string) => {
    onRepSearch(rep);
    setRepSearch("");
    setIsOpen(false);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!debouncedValue) return;
    onRepSelect(debouncedValue);
  };

  return (
    <div className="tw-max-w-full tw-relative tw-mt-2" ref={listRef}>
      <div className="tw-mt-2 tw-relative">
        <form onSubmit={onSubmit} className="tw-max-w-xs tw-mt-4">
          <label
            htmlFor="search-rep"
            className="tw-block tw-text-sm tw-font-normal tw-text-iron-400"
          >
            Add rep
          </label>
          <div className="tw-relative tw-mt-1.5">
            <svg
              className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
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
              id="search-rep"
              name="search-rep"
              type="text"
              required
              autoComplete="off"
              value={repSearch}
              onChange={handleRepSearchChange}
              onFocus={() => setIsOpen(true)}
              className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-4 tw-bg-iron-900 tw-text-iron-300 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none  focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-base tw-transition tw-duration-300 tw-ease-out"
              placeholder="Search"
            />
          </div>
        </form>
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
            <div className="tw-absolute tw-z-10 tw-mt-1 tw-overflow-hidden tw-max-w-full tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
              <div className="tw-py-1 tw-flow-root tw-max-h-[calc(240px+_-5vh)] tw-overflow-x-hidden tw-overflow-y-auto">
                <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                  {categories?.map((category) => (
                    <li
                      key={category}
                      className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
                    >
                      <button
                        onClick={() => onRepSelect(category)}
                        className="tw-bg-transparent tw-border-none tw-w-full tw-h-full tw-text-left"
                      >
                        <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
                          {category}
                        </span>
                      </button>
                    </li>
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
