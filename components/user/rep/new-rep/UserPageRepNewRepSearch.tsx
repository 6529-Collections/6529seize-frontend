import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useContext, useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { ApiProfileRepRatesState } from "../../../../entities/IProfile";
import UserPageRepNewRepSearchHeader from "./UserPageRepNewRepSearchHeader";
import UserPageRepNewRepSearchDropdown from "./UserPageRepNewRepSearchDropdown";
import { AuthContext } from "../../../auth/Auth";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

const MIN_SEARCH_LENGTH = 3;

export default function UserPageRepNewRepSearch({
  repRates,
  onRepSearch,
}: {
  readonly repRates: ApiProfileRepRatesState;
  readonly onRepSearch: (repSearch: string) => void;
}) {
  const { setToast } = useContext(AuthContext);
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
    enabled: debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const [isOpen, setIsOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const onRepSelect = async (rep: string) => {
    if (rep.length < MIN_SEARCH_LENGTH) return;
    if (checkingAvailability) return;
    setCheckingAvailability(true);
    try {
      await commonApiFetch<boolean>({
        endpoint: "/rep/categories/availability",
        params: {
          param: rep,
        },
      });
      onRepSearch(rep);
      setRepSearch("");
      setIsOpen(false);
    } catch (error: any) {
      setToast({
        message: (
          <div>
            {error} <br />
            <br />
            <span className="tw-text-sm">
              Rep is not meant for insults so we run proposed rep categories
              through an AI filter.
            </span>
            <br />
            <span className="tw-text-sm">
              If you think the filter got your proposed category wrong, hop into
              Discord and let us know.
            </span>
            <br />
            <span className="tw-text-sm">
              In the meantime, perhaps you can rephrase that you are trying to
              say.
            </span>
          </div>
        ),
        type: "error",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!debouncedValue) return;
    onRepSelect(debouncedValue);
  };

  const [categoriesToDisplay, setCategoriesToDisplay] = useState<string[]>([]);
  useEffect(() => {
    const items: string[] = [];
    if (debouncedValue.length >= MIN_SEARCH_LENGTH) {
      items.push(debouncedValue);
    }

    if (categories?.length) {
      items.push(
        ...categories.filter((category) => category !== debouncedValue)
      );
    }

    setCategoriesToDisplay(items);
    if (debouncedValue.length) {
      setIsOpen(true);
    }
  }, [debouncedValue, categories]);

  return (
    <div className="tw-max-w-full tw-relative tw-bg-iron-800 tw-p-4 sm:tw-p-6 tw-rounded-xl tw-border tw-border-solid tw-border-white/5">
      <UserPageRepNewRepSearchHeader repRates={repRates} />
      <div ref={listRef} className="tw-w-full sm:tw-max-w-xs">
        <div className="tw-w-full tw-mt-6 tw-relative">
          <form onSubmit={onSubmit} className="tw-w-full sm:tw-max-w-xs">
            <label
              htmlFor="search-rep"
              className="tw-block tw-text-sm tw-font-normal tw-text-iron-400"
            >
              Assign Rep
            </label>
            <div className="tw-w-full tw-relative tw-mt-1.5">
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
              {checkingAvailability && (
                <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center tw-right-0 tw-pr-3">
                  <CircleLoader />
                </div>
              )}
            </div>
          </form>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {isOpen && (
            <motion.div
              className="tw-origin-top-right tw-absolute tw-z-10  tw-mt-1 tw-w-full tw-max-w-xs tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <UserPageRepNewRepSearchDropdown
                categories={categoriesToDisplay}
                loading={isFetching}
                onRepSelect={onRepSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
