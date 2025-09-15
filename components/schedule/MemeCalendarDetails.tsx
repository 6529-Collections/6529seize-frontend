"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export default function MemeCalendarDetails() {
  return (
    <section className="tw-w-full">
      {/* Back to Calendar */}
      <div className="tw-flex tw-mb-3">
        <Link
          href="/memes-minting"
          className="tw-no-underline tw-flex tw-items-center tw-gap-2">
          <FontAwesomeIcon icon={faArrowLeft} />
          Memes Minting Calendar
        </Link>
      </div>
      <div className="tw-px-6 tw-py-6 tw-bg-[#0c0c0d] tw-rounded-md tw-border tw-border-solid tw-border-[#222222]">
        <p className="tw-text-xl tw-font-bold tw-mb-3">
          Meme Calendar — How It Works
        </p>

        <p className="tw-text-sm tw-text-gray-300 tw-leading-6 tw-mb-4">
          Here's the vibe: we launched with a one-off season in 2022, had a few
          human-era quirks in 2023-2025, and from 2026 the rhythm is clean and
          continuous. The views (SZN / Year / Epoch / Period / Era / Eon) follow
          that story, and the card you're currently in is{" "}
          <span className="tw-font-semibold tw-text-[#20fa59]">
            highlighted
          </span>
          .
        </p>

        <div className="tw-space-y-5">
          {/* SZN1 / Year 0 */}
          <div>
            <p className="tw-text-lg tw-font-semibold tw-mb-3">
              Year 0 — SZN1 (Historical)
            </p>
            <ul className="tw-text-sm tw-text-gray-300 tw-list-disc tw-ml-5 tw-space-y-1">
              <li>
                <span className="tw-font-medium">Date range:</span> Jun 2022 -
                Dec 2022.
              </li>
              <li>
                <span className="tw-font-medium">Mints:</span> Memes{" "}
                <span className="tw-whitespace-nowrap">#1 - #47</span>, at their
                exact historical timestamps.
              </li>
              <li>
                Everything before 2023 is shown as one card:{" "}
                <span className="tw-font-medium">SZN1</span>.
              </li>
            </ul>
          </div>

          {/* 2023-2025 historic SZN phases */}
          <div>
            <p className="tw-text-lg tw-font-semibold tw-mb-3">
              Years 1-3 (2023-2025) — Historic SZN Phases
            </p>
            <ul className="tw-text-sm tw-text-gray-300 tw-list-disc tw-ml-5 tw-space-y-1">
              <li>Only in-season blocks mint; named breaks don't.</li>
              <li>
                Default cadence is{" "}
                <span className="tw-font-medium">Mon / Wed / Fri</span> by{" "}
                <span className="tw-font-medium">UTC weekday</span>, with a
                couple of exceptions:
              </li>
              <ul className="tw-list-disc tw-ml-5 tw-mt-1 tw-space-y-1">
                <li>
                  <span className="tw-font-medium">Skipped</span> days (e.g.,
                  2023-05-08, 2024-02-07) — removed even if M/W/F.
                </li>
                <li>
                  <span className="tw-font-medium">Bonus</span> drops (e.g.,
                  2023-10-26 → #157, 2023-11-28 → #182) — included even if
                  off-schedule.
                </li>
              </ul>
              <li>Calendars are Monday-first (Mon → Sun).</li>
            </ul>
          </div>

          {/* Standardized schedule from 2026 */}
          <div>
            <p className="tw-text-lg tw-font-semibold tw-mb-3">
              From 2026-01-02 (Year 4) — Standardized & Continuous
            </p>
            <ul className="tw-text-sm tw-text-gray-300 tw-list-disc tw-ml-5 tw-space-y-1">
              <li>
                Every <span className="tw-font-medium">Mon / Wed / Fri</span>,
                no breaks.
              </li>
              <li>
                Start time follows EU-style DST:
                <ul className="tw-list-disc tw-ml-5 tw-mt-1 tw-space-y-1">
                  <li>Summer: 14:40 UTC</li>
                  <li>Winter: 15:40 UTC</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Numbering & divisions */}
          <div>
            <p className="tw-text-lg tw-font-semibold tw-mb-3">
              Numbering & Divisions
            </p>
            <ul className="tw-text-sm tw-text-gray-300 tw-list-disc tw-ml-5 tw-space-y-1">
              <li>
                <span className="tw-font-medium">Meme numbers:</span> #1-#47
                live in SZN1. #48 is the first 2023 mint day, then it counts
                forward over eligible days.
              </li>
              <li>
                <span className="tw-font-medium">Seasons (SZN):</span> 3-month
                buckets. 2023 Q1 is SZN2. Pre-2023 shows as one card (SZN1).
              </li>
              <li>
                <span className="tw-font-medium">Years:</span> Year 0 = 2022
                (SZN1). Year 1 = 2023. Year 4 = 2026, and so on.
              </li>
              <li>
                <span className="tw-font-medium">Epochs:</span> Epoch 0 = Year 0
                only. Epoch 1 = Years 1-4 (2023-2026), then regular 4-year
                blocks.
              </li>
              <li>
                <span className="tw-font-medium">Periods:</span> Period 0 =
                Epoch 0 only. Period 1 = Epochs 1-5 (20 years starting 2023).
              </li>
              <li>
                <span className="tw-font-medium">Eras:</span> Era 0 = SZN1 only.
                Era 1 starts Jan 2023 and spans 100 years (Periods 1-5).
              </li>
              <li>
                <span className="tw-font-medium">Eons:</span> Eon 0 = SZN1 only.
                Eon 1 starts Jan 2023 and spans 1,000 years (Eras 1-10).
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
