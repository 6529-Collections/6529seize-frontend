"use client";

import { ChartBarIcon } from "@heroicons/react/24/outline";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { numberWithCommas } from "@/helpers/Helpers";
import { useIdentityActivity } from "@/hooks/useIdentityActivity";
import clsx from "clsx";
import type { ReactNode } from "react";
import {
  buildUserPageBrainActivityViewModel,
  type UserPageBrainActivityCell,
} from "./userPageBrainActivity.helpers";
import { getProfileWaveIdentity } from "./userPageBrainSidebar.helpers";

const CELL_SIZE_PX = 12;
const CELL_GAP_PX = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getCellClassName(cell: UserPageBrainActivityCell): string {
  if (cell.state === "padding") {
    return "tw-bg-transparent";
  }

  if (cell.state === "empty") {
    return "tw-bg-[#161B22] tw-ring-1 tw-ring-inset tw-ring-white/[0.03]";
  }

  switch (cell.intensity) {
    case 4:
      return "tw-bg-[#00FFA3] tw-shadow-[0_0_8px_rgba(0,255,163,0.2)]";
    case 3:
      return "tw-bg-[#00B97A]";
    case 2:
      return "tw-bg-[#006B4B]";
    default:
      return "tw-bg-[#063C2A]";
  }
}

function ActivityCardFrame({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <section
      className="tw-overflow-hidden tw-rounded-[18px] tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[radial-gradient(circle_at_top_left,_rgba(0,255,163,0.08),_transparent_35%),linear-gradient(180deg,rgba(10,13,17,0.98),rgba(10,13,17,0.98))] tw-p-5 tw-shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
      aria-labelledby="brain-activity-heading"
      data-testid="brain-activity-card"
    >
      {children}
    </section>
  );
}

function ActivityCardHeader({
  totalDrops,
}: Readonly<{
  totalDrops?: number | undefined;
}>) {
  return (
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-items-center tw-gap-2.5">
          <ChartBarIcon className="tw-h-[18px] tw-w-[18px] tw-shrink-0 tw-text-[#00FFA3]" />
          <h3
            id="brain-activity-heading"
            className="tw-mb-0 tw-text-[15px] tw-font-bold tw-tracking-wide tw-text-white"
          >
            Activity
          </h3>
        </div>
      </div>
      {totalDrops !== undefined && (
        <div className="tw-max-w-[12rem] tw-text-right tw-text-[13px] tw-font-medium tw-text-[#7A838E] sm:tw-max-w-none">
          {numberWithCommas(totalDrops)} drop{totalDrops === 1 ? "" : "s"} in
          the last year
        </div>
      )}
    </div>
  );
}

function ActivityCardLoading() {
  return (
    <ActivityCardFrame>
      <ActivityCardHeader />
      <div className="tw-mt-4 tw-flex tw-gap-3" aria-label="Loading activity heatmap">
        <div className="tw-hidden tw-h-[102px] tw-shrink-0 tw-flex-col tw-justify-between tw-text-[11px] tw-font-medium tw-text-[#7A838E] sm:tw-flex">
          {DAY_LABELS.map((label, index) => (
            <div
              key={`${label || "empty"}-${index}`}
              className="tw-flex tw-h-3 tw-items-center tw-justify-end"
            >
              {label ? label : <span className="tw-opacity-0">Sun</span>}
            </div>
          ))}
        </div>
        <div className="no-scrollbar tw-flex-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1">
          <div className="tw-inline-flex tw-flex-col tw-gap-2">
            <div
              className="tw-grid tw-h-4 tw-items-end tw-text-[11px] tw-font-medium tw-text-[#7A838E]"
              style={{
                gridTemplateColumns: `repeat(53, ${CELL_SIZE_PX}px)`,
                columnGap: `${CELL_GAP_PX}px`,
              }}
            >
              {Array.from({ length: 53 }, (_, index) => (
                <div key={index} className="tw-relative tw-h-4">
                  {index % 4 === 0 ? (
                    <span className="tw-absolute tw-left-0 tw-whitespace-nowrap">
                      Jan
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div
              className="tw-grid tw-grid-flow-col tw-grid-rows-7 tw-gap-[3px]"
              style={{
                gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
                gridAutoColumns: `${CELL_SIZE_PX}px`,
              }}
            >
              {Array.from({ length: 53 * 7 }, (_, index) => (
                <div
                  key={index}
                  className="tw-h-3 tw-w-3 tw-animate-pulse tw-rounded-[2px] tw-bg-white/[0.06]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ActivityCardFrame>
  );
}

function ActivityCardMessage({
  message,
}: Readonly<{
  message: string;
}>) {
  return (
    <ActivityCardFrame>
      <ActivityCardHeader />
      <p className="tw-mt-4 tw-text-sm tw-text-iron-400">{message}</p>
    </ActivityCardFrame>
  );
}

export default function UserPageBrainActivity({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const identity = getProfileWaveIdentity(profile);
  const activityQuery = useIdentityActivity({
    identity,
    enabled: identity.length > 0,
  });

  if (!identity) {
    return null;
  }

  if (activityQuery.status === "pending") {
    return <ActivityCardLoading />;
  }

  if (activityQuery.status === "error") {
    return <ActivityCardMessage message="Unable to load activity." />;
  }

  if (!activityQuery.data) {
    return <ActivityCardMessage message="No activity data available." />;
  }

  const activity = buildUserPageBrainActivityViewModel(activityQuery.data);
  if (!activity) {
    return <ActivityCardMessage message="No activity data available." />;
  }

  const monthLabelMap = new Map(
    activity.monthLabels.map((label) => [label.column, label.label])
  );

  return (
    <ActivityCardFrame>
      <ActivityCardHeader totalDrops={activity.totalDrops} />

      <div className="tw-mt-4 tw-flex tw-gap-3">
        <div
          className="tw-hidden tw-h-[102px] tw-shrink-0 tw-flex-col tw-justify-between tw-text-[11px] tw-font-medium tw-text-[#7A838E] sm:tw-flex"
          aria-hidden="true"
        >
          {DAY_LABELS.map((label, index) => (
            <div
              key={`${label || "empty"}-${index}`}
              className="tw-flex tw-h-3 tw-items-center tw-justify-end"
            >
              {label ? label : <span className="tw-opacity-0">Sun</span>}
            </div>
          ))}
        </div>

        <div className="no-scrollbar tw-flex-1 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-1">
          <div className="tw-inline-flex tw-flex-col tw-gap-2">
            <div
              className="tw-grid tw-h-4 tw-items-end tw-text-[11px] tw-font-medium tw-text-[#7A838E]"
              aria-hidden="true"
              style={{
                gridTemplateColumns: `repeat(${activity.weekCount}, ${CELL_SIZE_PX}px)`,
                columnGap: `${CELL_GAP_PX}px`,
              }}
            >
              {Array.from({ length: activity.weekCount }, (_, column) => (
                <div key={column} className="tw-relative tw-h-4">
                  {monthLabelMap.has(column) ? (
                    <span className="tw-absolute tw-left-0 tw-whitespace-nowrap">
                      {monthLabelMap.get(column)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div
              className="tw-grid tw-grid-flow-col tw-grid-rows-7 tw-gap-[3px]"
              aria-label="Activity heatmap for the last 365 days"
              style={{
                gridTemplateRows: `repeat(7, ${CELL_SIZE_PX}px)`,
                gridAutoColumns: `${CELL_SIZE_PX}px`,
              }}
            >
              {activity.cells.map((cell) => (
                <div
                  key={cell.key}
                  role={cell.ariaLabel ? "img" : undefined}
                  aria-label={cell.ariaLabel ?? undefined}
                  aria-hidden={cell.ariaLabel ? undefined : true}
                  title={cell.title ?? undefined}
                  className={clsx(
                    "tw-h-3 tw-w-3 tw-rounded-[2px] tw-transition-colors",
                    cell.ariaLabel &&
                      "desktop-hover:hover:tw-outline desktop-hover:hover:tw-outline-1 desktop-hover:hover:tw-outline-white/40",
                    getCellClassName(cell)
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ActivityCardFrame>
  );
}
