"use client";
import { useState } from "react";
import type { DisplayTz } from "./meme-calendar.helpers";
import MemeCalendar from "./MemeCalendar";
import MemeCalendarOverview from "./MemeCalendarOverview";

export default function MemesMintingCalendar() {
  const [displayTz, setDisplayTz] = useState<DisplayTz>("local");

  const baseBtn =
    "tw-px-4 tw-py-1.5 tw-text-sm tw-font-medium tw-border tw-transition-colors tw-duration-200";

  const activeBtn =
    "tw-bg-blue-600 tw-text-white tw-border-blue-500 hover:tw-bg-blue-700";

  const inactiveBtn =
    "tw-bg-transparent tw-text-gray-300 tw-border-gray-600 hover:tw-bg-gray-700 hover:tw-text-white";

  return (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {/* Global Local/UTC toggle */}
      <div className="tw-flex tw-justify-end">
        <div className="tw-inline-flex">
          <button
            className={`${baseBtn} ${
              displayTz === "local" ? activeBtn : inactiveBtn
            } tw-rounded-l-md tw-border-r-0`}
            onClick={() => setDisplayTz("local")}
            title="Show local time">
            Local
          </button>
          <button
            className={`${baseBtn} ${
              displayTz === "utc" ? activeBtn : inactiveBtn
            } tw-rounded-r-md`}
            onClick={() => setDisplayTz("utc")}
            title="Show UTC">
            UTC
          </button>
        </div>
      </div>

      <div className="tw-flex tw-flex-wrap tw-gap-8">
        <div className="tw-w-full">
          <MemeCalendarOverview displayTz={displayTz} />
        </div>
        <div className="tw-w-full">
          <MemeCalendar displayTz={displayTz} />
        </div>
      </div>
    </div>
  );
}
