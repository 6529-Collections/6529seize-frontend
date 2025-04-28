import { useEffect, useState } from "react";
import { RatingStats } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
export default function UserPageRepsItem({
  rep,
  profile,
  canEditRep,
}: {
  readonly rep: RatingStats;
  readonly profile: ApiIdentity;
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
    <>
      <button
        onClick={() => setIsEditRepModalOpen(true)}
        disabled={!canEditRep}
        className="tw-bg-transparent tw-border-none tw-p-0 "
      >
        <span
          className={`${
            canEditRep ? "hover:tw-bg-iron-700" : ""
          } tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 
           tw-px-3 tw-py-1.5 sm:tw-py-1 tw-transition tw-duration-300 tw-ease-out`}
        >
          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-50">
            {rep.category}
          </span>

          <span
            className={`${
              isPositiveRating ? "tw-text-green" : "tw-text-red"
            } tw-whitespace-nowrap tw-font-medium tw-text-sm sm:tw-text-md`}
          >
            <Tippy
              content={`My Rep: ${formatNumberWithCommas(
                rep.rater_contribution
              )}`}
              theme="dark"
              placement="top"
              disabled={isTouchScreen || !rep.rater_contribution}
            >
              <span>{formatNumberWithCommas(rep.rating)}</span>
            </Tippy>
          </span>

          <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-sm tw-font-medium tw-text-iron-400">
            ({formatNumberWithCommas(rep.contributor_count)}{" "}
            {rep.contributor_count === 1 ? "rater" : "raters"})
          </span>
        </span>
      </button>
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
              category={rep.category}
              onClose={() => setIsEditRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
