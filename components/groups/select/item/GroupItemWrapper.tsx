import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getRandomColorWithSeed } from "@/helpers/Helpers";
import type { ReactNode } from "react";
import type { GroupSelectVariant } from "../groupSelect.types";

function getGroupBannerGradient(group: ApiGroupFull): string {
  const banner1 =
    group.created_by.banner1_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  const banner2 =
    group.created_by.banner2_color ??
    getRandomColorWithSeed(group.created_by.handle ?? "");
  return `linear-gradient(45deg, ${banner1} 0%, ${banner2} 100%)`;
}

export default function GroupItemWrapper({
  group,
  isActive,
  children,
  deactivateHover,
  onActiveGroupId,
  variant = "default",
}: {
  readonly group: ApiGroupFull;
  readonly isActive: boolean;
  readonly deactivateHover: boolean;
  readonly children: ReactNode;
  readonly onActiveGroupId?:
    | ((groupId: string | null) => void)
    | undefined
    | undefined;
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const isMobileSheet = variant === "mobile-sheet";
  const bannerGradient = isMobileSheet
    ? undefined
    : getGroupBannerGradient(group);

  const onFilterClick = () => {
    if (isActive || !onActiveGroupId) return;
    onActiveGroupId(group.id);
  };

  const getClasses = () => {
    if (isMobileSheet) {
      if (isActive) {
        return "tw-rounded-xl tw-border-[#263b65] tw-bg-[#0f1523]";
      }
      return "tw-rounded-xl tw-border-[#37373E] tw-bg-[#1C1C21] tw-cursor-pointer active:tw-scale-[0.99] desktop-hover:hover:tw-border-[#60606C] desktop-hover:hover:tw-bg-[#26272B]";
    }

    if (!isActive)
      return "tw-border-iron-700 hover:tw-border-primary-300 tw-cursor-pointer";
    if (deactivateHover) return "hover:tw-border-yellow";
    else return "tw-border-primary-300 ";
  };

  const classes = getClasses();

  if (isMobileSheet) {
    const sharedClassName = `tw-group tw-w-full tw-appearance-none tw-overflow-hidden tw-p-0 tw-text-left tw-relative tw-border tw-border-solid tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 ${classes}`;

    return (
      <div>
        {isActive || !onActiveGroupId ? (
          <div className={sharedClassName}>{children}</div>
        ) : (
          <button
            type="button"
            onClick={onFilterClick}
            className={sharedClassName}
          >
            {children}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={onFilterClick}
        className={`tw-relative tw-w-full tw-rounded-xl tw-border tw-border-solid tw-bg-iron-900 tw-text-left tw-transition tw-duration-300 tw-ease-out ${classes}`}
      >
        {bannerGradient && (
          <div
            className="tw-relative tw-h-7 tw-w-full tw-rounded-t-xl"
            style={{ background: bannerGradient }}
          ></div>
        )}
        {children}
      </div>
    </div>
  );
}
