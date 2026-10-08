"use client";

import type React from "react";
import { TabCountBadge } from "@/components/common/TabCountBadge";
import TabButton from "@/components/common/TabButton";
import MyStreamActionTooltip from "./MyStreamActionTooltip";

export interface TabOption {
  readonly key: string;
  readonly label: string;
  readonly panelId: string;
  readonly badgeCount?: number | null | undefined;
  readonly leadingIcon?: React.ReactNode | undefined;
  readonly leadingIconTooltipId?: string | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly action?: React.ReactNode | undefined;
}

export interface DesktopTabButtonProps {
  readonly option: TabOption;
  readonly activeKey: string;
  readonly onSelect: (key: string) => void;
}

export function DesktopTabButton({
  option,
  activeKey,
  onSelect,
}: DesktopTabButtonProps) {
  return (
    <TabButton
      onClick={() => onSelect(option.key)}
      role="tab"
      data-wave-tab-value={option.key.toLowerCase()}
      aria-selected={activeKey === option.key}
      aria-controls={option.panelId}
      className={`tw-relative tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-py-3 tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
        activeKey === option.key
          ? "tw-border-primary-300 tw-text-white"
          : "tw-border-transparent tw-text-iron-500 desktop-hover:hover:tw-text-iron-200"
      }`}
    >
      <span className="tw-inline-flex tw-h-5 tw-items-center tw-gap-1 tw-align-middle tw-leading-5">
        <span className="tw-leading-5">{option.label}</span>
        <TabCountBadge count={option.badgeCount} />
        {option.leadingIcon}
      </span>
      {option.hasIndicator && (
        <div className="tw-absolute -tw-right-1 tw-top-1 tw-h-2 tw-w-2 tw-rounded-full tw-bg-red"></div>
      )}
    </TabButton>
  );
}

export function DesktopTabOption({
  option,
  activeKey,
  onSelect,
}: DesktopTabButtonProps) {
  return (
    <div className="tw-flex tw-items-center">
      <DesktopTabButton
        option={option}
        activeKey={activeKey}
        onSelect={onSelect}
      />
      {option.leadingIconTooltipId !== undefined && (
        <MyStreamActionTooltip id={option.leadingIconTooltipId} />
      )}
      {option.action !== undefined && option.action !== null && (
        <div className="tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-border-transparent">
          {option.action}
        </div>
      )}
    </div>
  );
}
