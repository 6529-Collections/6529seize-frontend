"use client";

import { useState } from "react";
import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import {
  ApiProfileRepRatesState,
  RatingStats,
} from "@/entities/IProfile";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { AnimatePresence } from "framer-motion";

export default function UserPageRepNewRep({
  profile,
  repRates,
}: {
  readonly profile: ApiIdentity;
  readonly repRates: ApiProfileRepRatesState | null;
}) {
  const [isAddNewRepModalOpen, setIsAddNewRepModalOpen] =
    useState<boolean>(false);

  const [repToAdd, setRepToAdd] = useState<RatingStats | null>(null);

  const onRepSearch = (repSearch: string) => {
    const rep: RatingStats = repRates?.rating_stats.find(
      (r) => r.category === repSearch
    ) ?? {
      category: repSearch,
      rating: 0,
      contributor_count: 0,
      rater_contribution: 0,
    };
    setRepToAdd(rep);
    setIsAddNewRepModalOpen(true);
  };

  const onCloseModal = () => {
    setIsAddNewRepModalOpen(false);
    setRepToAdd(null);
  };

  return (
    <>
      <UserPageRepNewRepSearch
        onRepSearch={onRepSearch}
        repRates={repRates}
        profile={profile}
      />
      <AnimatePresence mode="sync" initial={true}>
        {isAddNewRepModalOpen && repToAdd && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <UserPageRepModifyModal
              profile={profile}
              category={repToAdd.category}
              onClose={onCloseModal}
            />
          </CommonAnimationOpacity>
        )}
      </AnimatePresence>
    </>
  );
}
