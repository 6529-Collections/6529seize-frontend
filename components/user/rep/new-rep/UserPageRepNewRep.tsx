import { useState } from "react";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepNewRepSearch from "./UserPageRepNewRepSearch";

export default function UserPageRepNewRep({
  profile,
  repRates,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly repRates: ApiProfileRepRatesState;
}) {
  const [isAddNewRepModalOpen, setIsAddNewRepModalOpen] =
    useState<boolean>(false);

  const [repToAdd, setRepToAdd] = useState<RatingStats | null>(null);

  const onRepSearch = (repSearch: string) => {
    const rep: RatingStats = repRates.rating_stats.find(
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
      <CommonAnimationWrapper mode="sync" initial={true}>
        {isAddNewRepModalOpen && repToAdd && (
          <CommonAnimationOpacity
            key="modal"
            elementClasses="tw-absolute tw-z-10"
            elementRole="dialog"
            onClicked={(e) => e.stopPropagation()}
          >
            <UserPageRepModifyModal
              profile={profile}
              repState={repToAdd}
              giverAvailableRep={repRates.rep_rates_left_for_rater ?? 0}
              onClose={onCloseModal}
            />
          </CommonAnimationOpacity>
        )}
      </CommonAnimationWrapper>
    </>
  );
}
