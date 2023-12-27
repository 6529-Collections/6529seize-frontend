import { useContext, useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import UserPageRepItemAddIcon from "./UserPageRepItemAddIcon";
import UserPageRepsItemEditIcon from "./UserPageRepsItemEditIcon";
import CommonAnimationWrapper from "../../../utils/animation/CommonAnimationWrapper";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import UserPageRepModifyModal from "../modify-rep/UserPageRepModifyModal";
import { AuthContext } from "../../../auth/Auth";
import { useRouter } from "next/router";
import Tippy from "@tippyjs/react";

export default function UserPageRepsItem({
  rep,
  profile,
  giverAvailableRep,
}: {
  readonly rep: RatingStats;
  readonly profile: IProfileAndConsolidations;
  readonly giverAvailableRep: number;
}) {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const isPositiveRating = rep.rating > 0;
  const [isEditRepModalOpen, setIsEditRepModalOpen] = useState<boolean>(false);

  const getCanEditRep = ({
    myProfile,
    targetProfile,
  }: {
    myProfile: IProfileAndConsolidations | null;
    targetProfile: IProfileAndConsolidations;
  }) => {
    if (!myProfile?.profile?.handle) {
      return false;
    }
    if (myProfile.profile.handle === targetProfile.profile?.handle) {
      return false;
    }
    return true;
  };

  const [canEditRep, setCanEditRep] = useState<boolean>(
    getCanEditRep({
      myProfile: connectedProfile,
      targetProfile: profile,
    })
  );

  useEffect(() => {
    setCanEditRep(
      getCanEditRep({
        myProfile: connectedProfile,
        targetProfile: profile,
      })
    );
  }, [connectedProfile, profile]);

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, [router.isReady]);

  return (
    <div>
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-lg tw-bg-iron-900 tw-border tw-border-solid tw-border-white/10 tw-px-3 tw-py-1">
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-200">
          {rep.category}
        </span>

        <span
          className={`${
            isPositiveRating ? "tw-text-green" : "tw-text-red"
          } tw-whitespace-nowrap tw-pt-0.5 tw-font-semibold tw-text-sm`}
        >
          <Tippy
            content="Total Rep"
            theme="dark"
            placement="top"
            disabled={isTouchScreen}
          >
            <span>{formatNumberWithCommas(rep.rating)}</span>
          </Tippy>
          {rep.rater_contribution && (
            <Tippy
              content="Your Rep"
              theme="dark"
              placement="top"
              disabled={isTouchScreen}
            >
              <span className="tw-ml-1 tw-text-[0.6875rem] tw-leading-5 tw-text-iron-400 tw-font-semibold">
                ({formatNumberWithCommas(rep.rater_contribution)})
              </span>
            </Tippy>
          )}
        </span>
        <span className="-tw-mt-0.5">
          <Tippy
            content="Contributors"
            theme="dark"
            placement="top"
            disabled={isTouchScreen}
          >
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-200">
              {formatNumberWithCommas(rep.contributor_count)}
            </span>
          </Tippy>
        </span>
        {canEditRep && (
          <Tippy
            content={rep.rater_contribution ? "Edit Rep" : "Add Rep"}
            theme="dark"
            placement="top"
            disabled={isTouchScreen}
          >
            <button
              onClick={() => setIsEditRepModalOpen(true)}
              type="button"
              className="-tw-mr-1 tw-group tw-relative tw-inline-flex tw-items-center tw-text-sm tw-font-medium tw-rounded-lg tw-bg-iron-800 tw-p-1.5 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
            >
              {rep.rater_contribution ? (
                <UserPageRepsItemEditIcon />
              ) : (
                <UserPageRepItemAddIcon />
              )}
            </button>
          </Tippy>
        )}
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
    </div>
  );
}
