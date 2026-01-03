import { AnimatePresence, motion } from "framer-motion";
import RepCategorySearchItem from "./RepCategorySearchItem";

export default function RepCategorySearchDropdown({
  open,
  categories,
  selected,
  disabledCategories = [],
  onSelect,
}: {
  readonly open: boolean;
  readonly categories: string[];
  readonly selected: string | null;
  readonly disabledCategories?: string[] | undefined;
  readonly onSelect: (newV: string) => void;
}) {
  const noResultsText =
    !selected || selected.length < 3
      ? "Type at least 3 characters"
      : "No results";
  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          className="tw-absolute tw-z-10 tw-mt-1.5 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-z-10 tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
            <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
              <ul className="tw-flex tw-flex-col tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                {categories.length ? (
                  categories.map((category) => (
                    <RepCategorySearchItem
                      key={category}
                      category={category}
                      selected={selected}
                      disabledCategories={disabledCategories}
                      onSelect={onSelect}
                    />
                  ))
                ) : (
                  <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
                    {noResultsText}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
