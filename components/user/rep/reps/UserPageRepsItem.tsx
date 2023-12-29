import { useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";

export default function UserPageRepsItem({
  rep,
  profile,
  giverAvailableRep,
  canEditRep,
}: {
  readonly rep: RatingStats;
  readonly profile: IProfileAndConsolidations;
  readonly giverAvailableRep: number;
  readonly canEditRep: boolean;
}) {
  const router = useRouter();
  const isPositiveRating = rep.rating > 0;
  const [isEditRepModalOpen, setIsEditRepModalOpen] = useState<boolean>(false);

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <button
      onClick={() => setIsEditRepModalOpen(true)}
      disabled={!canEditRep}
      className="tw-bg-transparent tw-border-none tw-p-0"
    >
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-lg tw-bg-iron-900 hover:tw-bg-iron-800 tw-border tw-border-solid tw-border-white/10 tw-px-3 tw-py-1.5 sm:tw-py-1 tw-transition tw-duration-300 tw-ease-out">
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-50">
          {rep.category}
        </span>

        <span
          className={`${
            isPositiveRating ? "tw-text-green" : "tw-text-red"
          } tw-whitespace-nowrap tw-font-medium tw-text-sm`}
        >
          <Tippy
            content={`My Rep: ${formatNumberWithCommas(
              rep.rater_contribution ?? 0
            )}`}
            theme="dark"
            placement="top"
            disabled={isTouchScreen || !rep.rater_contribution}
          >
            <span>{formatNumberWithCommas(rep.rating)}</span>
          </Tippy>
        </span>

        <span className="tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-400">
          ({formatNumberWithCommas(rep.contributor_count)}{" "}
          {rep.contributor_count === 1 ? "rater" : "raters"})
        </span>
      </span>
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isEditRepModalOpen && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageRepModifyModal
              profile={profile}
              repState={rep}
              giverAvailableRep={giverAvailableRep}
              onClose={() => setIsEditRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </button>
  );
}
