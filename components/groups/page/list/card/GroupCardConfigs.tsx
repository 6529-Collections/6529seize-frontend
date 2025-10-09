"use client";

import { useEffect, useRef, useState } from "react";
import { GroupDescriptionType } from "@/entities/IGroup";
import { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { ApiGroupFilterDirection } from "@/generated/models/ApiGroupFilterDirection";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import GroupCardConfig from "./GroupCardConfig";

export interface GroupCardConfigProps {
  readonly key: GroupDescriptionType;
  readonly value: string;
}

export default function GroupCardConfigs({
  group,
}: {
  readonly group?: ApiGroupFull;
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
    return {
      key: GroupDescriptionType.TDH,
      value,
    };
  };

  const getRepConfig = (
    rep: ApiGroupDescription["rep"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: rep.min, max: rep.max });
    const category = rep.category?.length ? `category: ${rep.category}` : null;
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
  ): GroupCardConfigProps | null => {
    if (!wallet_group_wallets_count) {
      return null;
    }
    return {
      key: GroupDescriptionType.WALLETS,
      value: `${wallet_group_wallets_count}`,
    };
  };

  const getConfigs = (): GroupCardConfigProps[] => {
    if (!group) {
      return [{ key: GroupDescriptionType.WALLETS, value: "0" }];
    }
    const configs: GroupCardConfigProps[] = [];
    const { tdh, rep, cic, level, identity_group_identities_count } =
      group.group;
    const tdhConfig = getTdhConfig(tdh);
    const repConfig = getRepConfig(rep);
    const cicConfig = getCicConfig(cic);
    const levelConfig = getLevelConfig(level);
    const walletsConfig = getWalletsConfig(identity_group_identities_count);
    if (tdhConfig) {
      configs.push(tdhConfig);
    }
    if (repConfig) {
      configs.push(repConfig);
    }
    if (cicConfig) {
      configs.push(cicConfig);
    }
    if (levelConfig) {
      configs.push(levelConfig);
    }
    if (walletsConfig) {
      configs.push(walletsConfig);
    }

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
    // Optionally, add an event listener for resize to handle dynamic resizing
    window.addEventListener("resize", checkForHiddenContent);
    return () => window.removeEventListener("resize", checkForHiddenContent);
  }, [configs]);

  return (
    <div className="tw-mt-2 tw-pb-4 tw-relative">
      <div className="tw-overflow-x-hidden">
        {isLeftHidden && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              scrollContainer("left");
            }}
            aria-label="Scroll left"
            className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-top-0.5 tw-z-[20] tw-p-0 tw-h-7 tw-w-7 tw-left-0 tw-bg-iron-900 hover:tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-rounded-md tw-border-none tw-transition tw-duration-300 tw-ease-out">
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-300 group-hover:tw-text-iron-50 tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
          className="tw-flex tw-items-center tw-gap-x-3 tw-overflow-x-auto horizontal-menu-hide-scrollbar"
          ref={containerRef}
          onScroll={checkForHiddenContent}>
          {configs.map((config, i) => (
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
            className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-top-0.5 tw-z-[20] tw-p-0 tw-h-7 tw-w-7 tw-right-0 tw-bg-iron-900 hover:tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-rounded-md tw-border-none tw-transition tw-duration-300 tw-ease-out">
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-300 group-hover:tw-text-iron-50 -tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
