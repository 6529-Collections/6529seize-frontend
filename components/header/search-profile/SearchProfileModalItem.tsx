import { useHover, useHoverDirty } from "react-use";
import { ProfileMinimal } from "../../../entities/IProfile";
import { cicToType, formatNumberWithCommas } from "../../../helpers/Helpers";
import { CIC_COLOR } from "../../user/identity/ratings/UserPageIdentityCICRatingsItem";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export default function SearchProfileModalItem({
  profile,
  onClose,
  isSelected,
  onHover,
}: {
  readonly isSelected: boolean;
  readonly profile: ProfileMinimal;
  readonly onClose: () => void;
  readonly onHover: (state: boolean) => void;
}) {
  const router = useRouter();
  const cicType = cicToType(profile.cic_rating);

  const goToProfile = () => {
    router.push(`/${profile.handle}/identity`);
    onClose();
  };

  const ref = useRef<HTMLDivElement>(null);
  const isHovering = useHoverDirty(ref);

  useEffect(() => {
    onHover(isHovering);
  }, [isHovering]);

  return (
    <div
      ref={ref}
      className={`${
        isSelected ? "tw-bg-primary-500" : ""
      } tw-rounded-md tw-px-2 tw-my-1 tw-transition tw-duration-300 tw-ease-out`}
    >
      <button
        onClick={goToProfile}
        className="tw-group tw-bg-transparent tw-border-none tw-cursor-default tw-select-none tw-rounded-md tw-space-x-2 tw-py-3 tw-flex tw-items-center tw-w-full"
      >
        <div className="tw-relative tw-mr-1">
          <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-w-5 tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
            {profile.level}
          </div>
          <span
            className={`tw-flex-shrink-0 tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full ${CIC_COLOR[cicType]}`}
          ></span>
        </div>
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
          {profile.handle}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-x-1 tw-text-sm tw-font-medium tw-text-iron-100">
          {!!profile.tdh && (
            <span>
              {formatNumberWithCommas(profile.tdh)}{" "}
              <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                TDH
              </span>
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
