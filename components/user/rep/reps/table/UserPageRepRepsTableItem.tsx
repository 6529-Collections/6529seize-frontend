import { useState } from "react";
import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../../entities/IProfile";
import CommonAnimationWrapper from "../../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../../modify-rep/UserPageRepModifyModal";

export default function UserPageRepRepsTableItem({
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
          ? "hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer"
          : ""
      }
      onClick={onTableClick}
    >
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-px-6 tw-text-sm tw-font-semibold tw-text-iron-50">
        {rep.category}
      </td>
      <td
        className={`${
          isPositiveRating ? "tw-text-green" : "tw-text-red"
        } tw-whitespace-nowrap tw-py-3.5 tw-px-6 tw-text-sm tw-font-medium tw-text-right`}
      >
        {rep.rating}
      </td>
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-px-6 tw-text-sm tw-font-medium tw-text-right tw-text-iron-400">
        {rep.contributor_count}
      </td>
      <td
        className={`${
          isPositiveRaterContribution ? "tw-text-green" : "tw-text-red"
        } tw-whitespace-nowrap tw-py-3.5 tw-px-6 tw-text-sm tw-font-medium tw-text-right`}
      >
        {rep.rater_contribution ? rep.rater_contribution : " "}
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
              repState={rep}
              giverAvailableRep={giverAvailableRep}
              onClose={() => setIsEditRepModalOpen(false)}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </tr>
  );
}
