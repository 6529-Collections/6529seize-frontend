"use client";

import { useEffect, useRef, useState } from "react";
import { GroupDescriptionType } from "@/entities/IGroup";
import type { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import GroupCardConfig from "./GroupCardConfig";

export interface GroupCardConfigProps {
  readonly key: GroupDescriptionType;
  readonly value: string;
  readonly label?: string | undefined;
  readonly tooltip?: string | undefined;
  readonly muted?: boolean | undefined;
}

const MANUAL_LIST_TOOLTIP =
  "Wallets explicitly listed in this group. Filter-matching wallets are not counted here.";

export default function GroupCardConfigs({
  group,
}: {
  readonly group?: ApiGroupFull | undefined;
}) {
  const directionLabels: Record<ApiGroupFilterDirection, string> = {
    [ApiGroupFilterDirection.Received]: "from",
    [ApiGroupFilterDirection.Sent]: "to",
  };

  const getMinMaxValue = ({
    min,
    max,
  }: {
    readonly min: number | null;
    readonly max: number | null;
  }): string | null => {
    if (min === null && max === null) {
      return null;
    }
    if (min === null) {
      return `<= ${max}`;
    }
    if (max === null) {
      return `>= ${min}`;
    }
    return `${min} - ${max}`;
  };

  const getIdentityValue = ({
    identity,
    direction,
  }: {
    readonly identity: string | null;
    readonly direction: ApiGroupFilterDirection | null;
  }): string | null => {
    if (!identity) {
      return null;
    }
    return `${
      direction ? directionLabels[direction] : ""
    } identity: ${identity}`;
  };

  const getTdhConfig = (
    tdh: ApiGroupDescription["tdh"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: tdh.min, max: tdh.max });
    if (!value) {
      return null;
    }
    let label = "Tdh";
    if (tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Xtdh) {
      label = "xTDH";
    } else if (tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both) {
      label = "TDH + xTDH";
    }

    return {
      key: GroupDescriptionType.TDH,
      value,
      label,
    };
  };

  const getRepConfig = (
    rep: ApiGroupDescription["rep"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: rep.min, max: rep.max });
    const category =
      typeof rep.category?.length === "number" && rep.category.length > 0
        ? `category: ${rep.category}`
        : null;
    const identity = getIdentityValue({
      identity: rep.user_identity,
      direction: rep.direction,
    });
    const parts = [value, category, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }
    return {
      key: GroupDescriptionType.REP,
      value: parts.join(", "),
    };
  };

  const getCicConfig = (
    cic: ApiGroupDescription["cic"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: cic.min, max: cic.max });
    const identity = getIdentityValue({
      identity: cic.user_identity,
      direction: cic.direction,
    });
    const parts = [value, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }

    return {
      key: GroupDescriptionType.NIC,
      value: parts.join(", "),
    };
  };

  const getLevelConfig = (
    level: ApiGroupDescription["level"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: level.min, max: level.max });
    if (!value) {
      return null;
    }
    return {
      key: GroupDescriptionType.LEVEL,
      value,
    };
  };

  const getWalletsConfig = (
    wallet_group_wallets_count: ApiGroupDescription["identity_group_identities_count"]
  ): GroupCardConfigProps => {
    const hasManualList = wallet_group_wallets_count > 0;

    return {
      key: GroupDescriptionType.WALLETS,
      value: hasManualList ? `${wallet_group_wallets_count}` : "No manual list",
      label: "Manual list",
      tooltip: MANUAL_LIST_TOOLTIP,
      muted: !hasManualList,
    };
  };

  const getConfigs = (): GroupCardConfigProps[] => {
    if (!group) {
      return [
        {
          key: GroupDescriptionType.WALLETS,
          value: "No manual list",
          label: "Manual list",
          tooltip: MANUAL_LIST_TOOLTIP,
          muted: true,
        },
      ];
    }
    const configs: GroupCardConfigProps[] = [];
    const { tdh, rep, cic, level, identity_group_identities_count } =
      group.group;
    const tdhConfig = getTdhConfig(tdh);
    const repConfig = getRepConfig(rep);
    const cicConfig = getCicConfig(cic);
    const levelConfig = getLevelConfig(level);
    const walletsConfig = getWalletsConfig(identity_group_identities_count);
    if (tdhConfig) configs.push(tdhConfig);
    if (repConfig) configs.push(repConfig);
    if (cicConfig) configs.push(cicConfig);
    if (levelConfig) configs.push(levelConfig);
    configs.push(walletsConfig);

    return configs;
  };

  const configs = getConfigs();

  const [isLeftHidden, setIsLeftHidden] = useState(false);
  const [isRightHidden, setIsRightHidden] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkForHiddenContent = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setIsLeftHidden(scrollLeft > 0);
      setIsRightHidden(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollContainer = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -200 : 200; // Adjust scroll amount as needed
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkForHiddenContent();

    const container = containerRef.current;
    const canObserve =
      typeof ResizeObserver !== "undefined" && !!containerRef.current;

    const observer = canObserve
      ? new ResizeObserver(() => checkForHiddenContent())
      : null;

    if (observer && container) {
      observer.observe(container);
    } else {
      // Fallback: still respond to window resizes
      window.addEventListener("resize", checkForHiddenContent);
    }

    return () => {
      if (observer && container) {
        observer.unobserve(container);
        observer.disconnect();
      }
      window.removeEventListener("resize", checkForHiddenContent);
    };
  }, []);

  return (
    <div className="tw-relative tw-flex tw-items-start tw-text-xs tw-text-iron-200 sm:tw-text-sm">
      <div className="tw-w-full tw-overflow-x-hidden">
        {isLeftHidden && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              scrollContainer("left");
            }}
            aria-label="Scroll left"
            className="tw-border-white/ tw-absolute tw-left-0 tw-top-1/2 tw-z-30 tw-inline-flex tw-h-7 tw-w-7 -tw-translate-x-3 tw-translate-y-[-50%] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-bg-iron-800 tw-text-white tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 desktop-hover:hover:tw-bg-white/10"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div
          className="horizontal-menu-hide-scrollbar tw-flex tw-items-center tw-gap-x-4 tw-gap-y-2 tw-overflow-x-auto tw-py-0.5"
          ref={containerRef}
          onScroll={checkForHiddenContent}
        >
          {configs.map((config) => (
            <GroupCardConfig config={config} key={config.key} />
          ))}
        </div>
        {isRightHidden && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              scrollContainer("right");
            }}
            aria-label="Scroll right"
            className="tw-absolute tw-right-0 tw-top-1/2 tw-z-30 tw-inline-flex tw-h-7 tw-w-7 tw-translate-x-3 tw-translate-y-[-50%] tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-iron-800 tw-text-white tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500 desktop-hover:hover:tw-bg-white/10"
          >
            <svg
              className="tw-h-4 tw-w-4 -tw-rotate-90 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:hover:tw-text-white"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
