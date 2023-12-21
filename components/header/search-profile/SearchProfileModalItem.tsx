import { useHoverDirty } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { cicToType, formatNumberWithCommas } from "../../../helpers/Helpers";
import { CIC_COLOR } from "../../user/identity/ratings/UserPageIdentityCICRatingsItem";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import SearchProfileModalItemHighlight from "./SearchProfileModalItemHighlight";

export default function SearchProfileModalItem({
  profile,
  searchValue,
  onClose,
  isSelected,
  onHover,
}: {
  readonly isSelected: boolean;
  readonly searchValue: string;
  readonly profile: CommunityMemberMinimal;
  readonly onClose: () => void;
  readonly onHover: (state: boolean) => void;
}) {
  const router = useRouter();
  const cicType = cicToType(profile.cic_rating);

  const goToProfile = () => {
    router.push(`/${profile.handle ?? profile.wallet}/identity`);
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
        isSelected ? "tw-bg-iron-800" : ""
      } tw-rounded-md tw-px-2 tw-py-2 tw-my-1 tw-transition tw-duration-300 tw-ease-out tw-w-full`}
    >
      <button
        onClick={goToProfile}
        className="tw-group tw-bg-transparent tw-border-none tw-cursor-default tw-select-none tw-rounded-md tw-space-x-3 tw-flex tw-w-full tw-text-left"
      >
        <div className="tw-relative tw-mt-0.5">
          <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-w-5 tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
            {profile.level}
          </div>
          <span
            className={`tw-flex-shrink-0 tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full ${CIC_COLOR[cicType]}`}
          ></span>
        </div>
        <div className="tw-w-full">
          <div className="tw-inline-flex tw-justify-between tw-w-full">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
              <SearchProfileModalItemHighlight
                text={profile.handle ?? "-"}
                highlight={searchValue}
              />
            </span>

            {!!profile.tdh && (
              <span className="tw-inline-flex tw-items-center tw-gap-x-1 tw-text-sm tw-font-medium tw-text-iron-100">
                {formatNumberWithCommas(profile.tdh)}{" "}
                <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                  TDH
                </span>
              </span>
            )}
          </div>

          <p className="tw-break-all tw-mb-0 tw-text-sm tw-text-iron-400">
            <SearchProfileModalItemHighlight
              text={profile.display ?? ""}
              highlight={searchValue}
            />
          </p>
        </div>
      </button>
    </div>
  );
}
