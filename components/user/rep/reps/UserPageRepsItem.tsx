"use client";

import CommonAnimationOpacity from "@/components/utils/animation/CommonAnimationOpacity";
import type { RatingStats } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import { AnimatePresence } from "framer-motion";
export default function UserPageRepsItem({
  rep,
  profile,
  canEditRep,
}: {
  readonly rep: RatingStats;
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
}) {
  const isPositiveRating = rep.rating > 0;
  const [isEditRepModalOpen, setIsEditRepModalOpen] = useState<boolean>(false);

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsEditRepModalOpen(true)}
        disabled={!canEditRep}
        className="tw-bg-transparent tw-border-none tw-p-0 ">
        <span
          className={`${
            canEditRep ? "hover:tw-bg-iron-700" : ""
          } tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 
           tw-px-3 tw-py-1.5 sm:tw-py-1 tw-transition tw-duration-300 tw-ease-out`}>
          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-50">
            {rep.category}
          </span>

          <span
            className={`${
              isPositiveRating ? "tw-text-green" : "tw-text-red"
            } tw-whitespace-nowrap tw-font-medium tw-text-sm sm:tw-text-md`}>
            <>
              <span data-tooltip-id={`rep-${rep.category}-${rep.rating}`}>
                {formatNumberWithCommas(rep.rating)}
              </span>
              {!isTouchScreen && !!rep.rater_contribution ? (
                <Tooltip
                  id={`rep-${rep.category}-${rep.rating}`}
                  place="top"
                  style={{
                    backgroundColor: "#1F2937",
                    color: "white",
                    padding: "4px 8px",
                  }}>
                  My Rep: {formatNumberWithCommas(rep.rater_contribution)}
                </Tooltip>
              ) : null}
            </>
          </span>

          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-sm tw-font-medium tw-text-iron-400">
            ({formatNumberWithCommas(rep.contributor_count)}{" "}
            {rep.contributor_count === 1 ? "rater" : "raters"})
          </span>
        </span>
      </button>
      <AnimatePresence mode="sync" initial={true}>
        {isEditRepModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}>
            <UserPageRepModifyModal
              profile={profile}
              category={rep.category}
              onClose={() => setIsEditRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </AnimatePresence>
    </>
  );
}
