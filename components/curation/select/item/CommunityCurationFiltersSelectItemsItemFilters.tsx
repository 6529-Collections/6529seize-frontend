import { useState } from "react";
import { GeneralFilter } from "../../../../helpers/filters/Filters.types";
import CurationBuildFilterStatementsList from "../../filter-builder/statements/CurationBuildFilterStatementsList";
import { AnimatePresence, motion } from "framer-motion";

export default function CommunityCurationFiltersSelectItemsItemFilters({
  showFilters,
  filters,
}: {
  readonly showFilters: boolean;
  readonly filters: GeneralFilter;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {showFilters && (
        <motion.div
          className="tw-pt-2"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
         
        </motion.div>
      )}
    </AnimatePresence>
  );
}
