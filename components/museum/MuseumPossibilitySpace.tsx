"use client";

import { useState } from "react";
import { MuseumHeldPositionSelection } from "@/components/museum/MuseumHeldPositionSelection";
import { MuseumProjectSystemVisual } from "@/components/museum/possibility-space/MuseumProjectSystemVisual";
import { replaceBrowserUrl } from "@/components/museum/possibility-space/shared";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  MuseumGenerativeStudy,
  MuseumMintedProjectIndex,
} from "@/lib/museum/generative-studies";

interface MuseumPossibilitySpaceProps {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly mintedIndex: MuseumMintedProjectIndex;
  readonly initialWorkId?: string | undefined;
  readonly workHrefs?: Readonly<Record<string, string>>;
}

const EMPTY_WORK_HREFS: Readonly<Record<string, string>> = {};

const controlClass =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-px-4 tw-text-sm tw-font-semibold tw-transition-colors motion-reduce:tw-transition-none focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
const selectedControlClass =
  "tw-border-primary-300 tw-bg-primary-500 tw-text-white";

function PossibilitySpaceTable({
  study,
  locale,
  selectedWorkId,
}: Pick<MuseumPossibilitySpaceProps, "study" | "locale"> & {
  readonly selectedWorkId: string;
}) {
  const visualization = study.visualization;
  const selectedWork = study.heldPositions.find(
    (position) => position.objectId === selectedWorkId
  );
  const latticeRows =
    visualization.kind === "exhaustive_lattice"
      ? visualization.rows.flatMap((row, rowIndex) =>
          visualization.columns.flatMap((column, columnGroupIndex) =>
            column.values.map((value, valueIndex) => ({
              row,
              group: column.group,
              value,
              held:
                rowIndex === visualization.selected.rowIndex &&
                columnGroupIndex === visualization.selected.columnGroupIndex &&
                valueIndex === visualization.selected.valueIndex,
            }))
          )
        )
      : [];

  return (
    <section
      className="tw-overflow-x-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10"
      aria-label={t(locale, "museum.network.insideSystem.dataTable")}
    >
      <table className="tw-w-full tw-min-w-[36rem] tw-border-collapse tw-text-left tw-text-sm">
        <caption className="tw-sr-only">
          {t(locale, "museum.network.insideSystem.dataTableCaption", {
            project: study.projectTitle,
          })}
        </caption>
        <thead className="tw-bg-iron-900 tw-text-iron-300">
          <tr>
            <th scope="col" className="tw-p-3 tw-font-semibold">
              {t(locale, "museum.network.insideSystem.dimension")}
            </th>
            <th scope="col" className="tw-p-3 tw-font-semibold">
              {t(locale, "museum.network.insideSystem.position")}
            </th>
            <th scope="col" className="tw-p-3 tw-font-semibold">
              {t(locale, "museum.network.insideSystem.value")}
            </th>
            <th scope="col" className="tw-p-3 tw-font-semibold">
              {t(locale, "museum.network.insideSystem.museumWork")}
            </th>
          </tr>
        </thead>
        <tbody>
          {latticeRows.length > 0
            ? latticeRows.map((row) => (
                <tr
                  key={`${row.row}-${row.group}-${row.value}`}
                  className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
                >
                  <th
                    scope="row"
                    className="tw-p-3 tw-font-medium tw-text-iron-200"
                  >
                    {row.row}
                  </th>
                  <td className="tw-p-3 tw-text-iron-300">{row.group}</td>
                  <td className="tw-p-3 tw-text-iron-300">{row.value}</td>
                  <td className="tw-p-3 tw-text-iron-300">
                    {row.held
                      ? `◆ ${selectedWork?.title ?? ""}`
                      : "—"}
                  </td>
                </tr>
              ))
            : study.axes.flatMap((axis) =>
                axis.values.map((value) => {
                  const worksAtValue = study.heldPositions.filter((position) =>
                    position.coordinates.some(
                      (coordinate) =>
                        coordinate.label === axis.label &&
                        coordinate.value === value.label
                    )
                  );
                  return (
                    <tr
                      key={`${axis.id}-${value.label}`}
                      className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800"
                    >
                      <th
                        scope="row"
                        className="tw-p-3 tw-font-medium tw-text-iron-200"
                      >
                        {axis.label}
                      </th>
                      <td className="tw-p-3 tw-text-iron-300">
                        {value.label}
                      </td>
                      <td className="tw-p-3 tw-tabular-nums tw-text-iron-300">
                        {value.count === undefined
                          ? "—"
                          : formatInteger(locale, value.count)}
                      </td>
                      <td className="tw-p-3 tw-text-iron-300">
                        {worksAtValue.length === 0
                          ? "—"
                          : worksAtValue
                              .map((position) =>
                                position.objectId === selectedWorkId
                                  ? `◆ ${position.title}`
                                  : position.title
                              )
                              .join(", ")}
                      </td>
                    </tr>
                  );
                })
              )}
        </tbody>
      </table>
    </section>
  );
}

export function MuseumPossibilitySpace({
  study,
  locale,
  mintedIndex,
  initialWorkId,
  workHrefs = EMPTY_WORK_HREFS,
}: MuseumPossibilitySpaceProps) {
  const defaultPosition =
    study.heldPositions.find(
      (position) => position.objectId === initialWorkId
    ) ?? study.heldPositions[0];
  const [view, setView] = useState<"visual" | "table">("visual");
  const [selectedWorkId, setSelectedWorkId] = useState(
    defaultPosition?.objectId ?? ""
  );

  const selectWork = (objectId: string) => {
    setSelectedWorkId(objectId);
    const url = new URL(window.location.href);
    url.searchParams.set("work", objectId);
    url.hash = "possibility-space";
    replaceBrowserUrl(url);
  };

  return (
    <section
      id="possibility-space"
      aria-labelledby="possibility-space-title"
      className="tw-scroll-mt-24 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
    >
      <h2 id="possibility-space-title" className="tw-sr-only">
        {study.mapLabel}
      </h2>

      <MuseumHeldPositionSelection
        study={study}
        locale={locale}
        selectedWorkId={selectedWorkId}
        onSelectWork={selectWork}
        workHrefs={workHrefs}
      />

      <MuseumProjectSystemVisual
        study={study}
        locale={locale}
        mintedIndex={mintedIndex}
        selectedWorkId={selectedWorkId}
      />

      <div
        className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-text-sm tw-text-iron-400"
        aria-label={t(locale, "museum.network.insideSystem.legend")}
      >
        <span>
          <span aria-hidden="true" className="tw-text-white">
            ◆
          </span>{" "}
          {t(locale, "museum.network.insideSystem.museumHeld")}
        </span>
        <span>
          <span
            aria-hidden="true"
            className="tw-inline-block tw-size-2 tw-rounded-full tw-bg-primary-400"
          />{" "}
          {t(locale, "museum.network.insideSystem.selected")}
        </span>
      </div>

      <div className="tw-mt-10 tw-flex tw-flex-col tw-gap-5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 md:tw-flex-row md:tw-items-end md:tw-justify-between">
        <div className="tw-max-w-3xl">
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
            {t(locale, "museum.network.insideSystem.analysisView")}
          </p>
          <p
            id="possibility-space-coverage"
            className="tw-m-0 tw-mt-3 tw-text-base tw-leading-7 tw-text-iron-300"
          >
            {study.coverageStatement}
          </p>
        </div>
        <div
          className="tw-flex tw-gap-2"
          aria-label={t(locale, "museum.network.insideSystem.viewSelector")}
        >
          <button
            type="button"
            aria-pressed={view === "visual"}
            onClick={() => setView("visual")}
            className={`${controlClass} ${view === "visual" ? selectedControlClass : "tw-border-iron-700 tw-bg-black tw-text-iron-300 hover:tw-text-white"}`}
          >
            {t(locale, "museum.network.insideSystem.visualView")}
          </button>
          <button
            type="button"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
            className={`${controlClass} ${view === "table" ? selectedControlClass : "tw-border-iron-700 tw-bg-black tw-text-iron-300 hover:tw-text-white"}`}
          >
            {t(locale, "museum.network.insideSystem.tableView")}
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="tw-mt-6">
          <PossibilitySpaceTable
            study={study}
            locale={locale}
            selectedWorkId={selectedWorkId}
          />
        </div>
      ) : null}
    </section>
  );
}
