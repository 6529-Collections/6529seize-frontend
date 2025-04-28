import { useState } from "react";
import { RatingStats } from "../../../../../entities/IProfile";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../../modify-rep/UserPageRepModifyModal";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import { ApiIdentity } from "../../../../../generated/models/ApiIdentity";
export default function UserPageRepRepsTableItem({
  rep,
  profile,
  canEditRep,
}: {
  readonly rep: RatingStats;
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
}) {
  const isPositiveRating = rep.rating > 0;
  const isPositiveRaterContribution = rep.rater_contribution > 0;
  const [isEditRepModalOpen, setIsEditRepModalOpen] = useState<boolean>(false);

  const onTableClick = () => {
    if (canEditRep) {
      setIsEditRepModalOpen(true);
    }
  };

  return (
    <tr
      key={rep.category}
      className={
        canEditRep
          ? "hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer even:tw-bg-iron-900"
          : "even:tw-bg-iron-900"
      }
      onClick={onTableClick}
    >
      <td className="tw-max-w-[12rem] lg:tw-max-w-[20rem] tw-truncate tw-whitespace-nowrap tw-py-3 tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-base tw-font-medium tw-text-iron-50">
        <span>{rep.category}</span>
      </td>
      <td
        className={`${
          isPositiveRating ? "tw-text-green" : "tw-text-red"
        } tw-whitespace-nowrap tw-py-3 tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-base tw-font-medium tw-text-right`}
      >
        {formatNumberWithCommas(rep.rating)}
      </td>
      <td className="tw-whitespace-nowrap tw-py-3 tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-base tw-font-medium tw-text-right tw-text-iron-400">
        {formatNumberWithCommas(rep.contributor_count)}
      </td>
      {canEditRep && (
        <>
          <td
            className={`${
              isPositiveRaterContribution ? "tw-text-green" : "tw-text-red"
            } tw-whitespace-nowrap tw-py-3 tw-px-4 sm:tw-px-6 tw-text-sm sm:tw-text-base tw-font-medium tw-text-right`}
          >
            {rep.rater_contribution
              ? formatNumberWithCommas(rep.rater_contribution)
              : " "}
          </td>
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
      )}
    </tr>
  );
}
