"use client";

import { useId, useState, type ReactNode } from "react";
import { Seg } from "@/components/explained/lens/controls";
import { EX_FOCUS } from "@/components/explained/tokens";
import {
  ARCH_LABEL,
  type Arch,
  type CloudProvider,
  type CloudRow,
} from "./_lib/cloud";

/**
 * Instance types at nine providers: the cheapest type that fits at each
 * provider first, then every type priced at one provider, filtered by
 * processor (Arm or x86). Each row carries its source. A table on a wide
 * screen, one card per type on a phone.
 */
interface CloudCopy {
  readonly provider: string;
  readonly all: string;
  readonly arch: string;
  readonly archAny: string;
  readonly caption: string;
  readonly cols: {
    readonly provider: string;
    readonly type: string;
    readonly cpu: string;
    readonly size: string;
    readonly disk: string;
    readonly burst: string;
    readonly total: string;
  };
  /** "machine {price}" with the placeholder left in. */
  readonly machine: string;
  readonly cantOrder: string;
  /** "{provider} has no {arch} types." */
  readonly none: string;
  readonly region: string;
  readonly source: string;
  readonly allNote: string;
}

export interface ProviderMeta {
  /** "Source: …, read Oct 31, 2026", for the rows' titles. */
  readonly title: string;
  /** The source line printed under the table, with its link. */
  readonly line: ReactNode;
}

type ArchFilter = Arch | "any";

interface ShownRow {
  readonly provider: CloudProvider;
  readonly row: CloudRow | null;
}

function cheapest(provider: CloudProvider, arch: ArchFilter): CloudRow | null {
  const fits = provider.rows.filter(
    (row) => row.orderable && (arch === "any" || row.arch === arch)
  );
  return fits.reduce<CloudRow | null>(
    (best, row) => (best === null || row.totalUsd < best.totalUsd ? row : best),
    null
  );
}

/** The rows a view shows: one per provider in the summary, sorted by price. */
export function shownRows(
  providers: readonly CloudProvider[],
  tab: string,
  arch: ArchFilter
): ShownRow[] {
  if (tab === "all") {
    return providers
      .map((provider) => ({ provider, row: cheapest(provider, arch) }))
      .sort(
        (a, b) =>
          (a.row?.totalUsd ?? Number.POSITIVE_INFINITY) -
          (b.row?.totalUsd ?? Number.POSITIVE_INFINITY)
      );
  }
  const provider = providers.find((entry) => entry.id === tab);
  if (!provider) return [];
  const rows = provider.rows.filter(
    (row) => arch === "any" || row.arch === arch
  );
  return rows.length > 0
    ? rows.map((row) => ({ provider, row }))
    : [{ provider, row: null }];
}

function ArchTag({ arch }: { readonly arch: Arch }) {
  return (
    <span
      className={`tw-inline-block tw-rounded tw-px-1.5 tw-text-xs tw-font-semibold tw-leading-5 ${arch === "arm" ? "tw-bg-iron-800 tw-text-iron-50" : "tw-bg-iron-900 tw-text-iron-300"}`}
    >
      {ARCH_LABEL[arch]}
    </span>
  );
}

function TypeName({ row }: { readonly row: CloudRow }) {
  return (
    <>
      <code className="tw-font-mono tw-text-[14px] tw-text-iron-50 [overflow-wrap:anywhere]">
        {row.type}
      </code>
      {row.family !== undefined && (
        <span className="tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {row.family}
        </span>
      )}
    </>
  );
}

function Total({
  row,
  copy,
  showMachine,
}: {
  readonly row: CloudRow;
  readonly copy: CloudCopy;
  readonly showMachine: boolean;
}) {
  return (
    <>
      <span className="tw-block tw-text-[17px] tw-font-semibold tw-leading-6 tw-text-iron-50">
        {row.total}
      </span>
      {row.totalNote !== undefined && (
        <span className="tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {row.totalNote}
        </span>
      )}
      {showMachine && row.machine !== row.total && (
        <span className="tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
          {copy.machine.replace("{price}", row.machine)}
        </span>
      )}
      {!row.orderable && (
        <span className="tw-block tw-text-[13px] tw-font-semibold tw-leading-5 tw-text-iron-300">
          {copy.cantOrder}
        </span>
      )}
    </>
  );
}

export default function CloudTable({
  providers,
  meta,
  allSource,
  copy,
}: {
  readonly providers: readonly CloudProvider[];
  readonly meta: Readonly<Record<string, ProviderMeta>>;
  /** The summary's source line. */
  readonly allSource: ProviderMeta;
  readonly copy: CloudCopy;
}) {
  const [tab, setTab] = useState("all");
  const [arch, setArch] = useState<ArchFilter>("any");
  const selectId = useId();
  const rows = shownRows(providers, tab, arch);
  const summary = tab === "all";
  const current = providers.find((entry) => entry.id === tab);
  const info = current ? meta[current.id] : allSource;
  const tabs = [
    { value: "all", label: copy.all },
    ...providers.map((provider) => ({
      value: provider.id,
      label: provider.name,
    })),
  ];
  const archOptions = [
    { value: "any" as const, label: copy.archAny },
    { value: "arm" as const, label: ARCH_LABEL.arm },
    { value: "x86" as const, label: ARCH_LABEL.x86 },
  ];
  const titleOf = (provider: CloudProvider) => meta[provider.id]?.title ?? "";
  const factOf = (provider: CloudProvider, row: CloudRow) =>
    `hw.cloud.${provider.id}.${row.id}`;
  const noneText = (provider: CloudProvider) =>
    copy.none
      .replace("{provider}", provider.name)
      .replace("{arch}", arch === "any" ? "" : ARCH_LABEL[arch]);

  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
      data-lens="cloud"
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-p-4 md:tw-p-5">
        <div
          className="tw-hidden tw-flex-wrap tw-gap-1.5 md:tw-flex"
          role="group"
          aria-label={copy.provider}
        >
          {tabs.map((option) => {
            const on = option.value === tab;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={on}
                data-provider={option.value}
                onClick={() => setTab(option.value)}
                className={`tw-min-h-9 tw-cursor-pointer tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-px-3.5 tw-text-sm tw-font-semibold ${on ? "tw-border-iron-50 tw-bg-iron-50 tw-text-iron-950" : "tw-border-iron-700 tw-bg-transparent tw-text-iron-300 hover:tw-border-iron-500 hover:tw-text-iron-50"} ${EX_FOCUS}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-3">
          <label
            htmlFor={selectId}
            className="tw-flex tw-w-full tw-flex-col tw-gap-1.5 md:tw-hidden"
          >
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400">
              {copy.provider}
            </span>
            <select
              id={selectId}
              value={tab}
              onChange={(event) => setTab(event.target.value)}
              className={`tw-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-base tw-font-semibold tw-text-iron-50 ${EX_FOCUS}`}
            >
              {tabs.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400">
            {copy.arch}
          </span>
          <Seg<ArchFilter>
            label={copy.arch}
            options={archOptions}
            value={arch}
            onChange={setArch}
            attr="arch"
          />
        </div>
      </div>

      <div aria-live="polite">
        <table
          className="tw-hidden tw-w-full tw-border-collapse tw-text-[15px] tw-leading-6 before:tw-content-none after:tw-content-none lg:tw-table [&_:is(thead,tbody,tr)]:before:tw-content-none [&_:is(thead,tbody,tr)]:after:tw-content-none"
          aria-label={copy.caption}
        >
          <thead>
            <tr className="tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400">
              {summary && (
                <th
                  scope="col"
                  className="tw-py-3 tw-pl-5 tw-pr-3 tw-font-semibold"
                >
                  {copy.cols.provider}
                </th>
              )}
              <th
                scope="col"
                className={`tw-py-3 tw-pr-3 tw-font-semibold ${summary ? "" : "tw-pl-5"}`}
              >
                {copy.cols.type}
              </th>
              <th scope="col" className="tw-py-3 tw-pr-3 tw-font-semibold">
                {copy.cols.cpu}
              </th>
              <th scope="col" className="tw-py-3 tw-pr-3 tw-font-semibold">
                {copy.cols.size}
              </th>
              <th scope="col" className="tw-py-3 tw-pr-3 tw-font-semibold">
                {copy.cols.disk}
              </th>
              <th scope="col" className="tw-py-3 tw-pr-3 tw-font-semibold">
                {copy.cols.burst}
              </th>
              <th
                scope="col"
                className="tw-py-3 tw-pr-5 tw-text-right tw-font-semibold"
              >
                {copy.cols.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ provider, row }) =>
              row === null ? (
                <tr
                  key={`${provider.id}-none`}
                  className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-900"
                >
                  <td
                    colSpan={summary ? 7 : 6}
                    className="tw-px-5 tw-py-3.5 tw-text-iron-400"
                  >
                    {noneText(provider)}
                  </td>
                </tr>
              ) : (
                <tr
                  key={`${provider.id}-${row.id}`}
                  data-fact={factOf(provider, row)}
                  title={titleOf(provider)}
                  className={`tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-align-top ${row.orderable ? "" : "tw-opacity-60"}`}
                >
                  {summary && (
                    <th
                      scope="row"
                      className="tw-py-3.5 tw-pl-5 tw-pr-3 tw-text-left tw-font-semibold tw-text-iron-50"
                    >
                      {provider.name}
                    </th>
                  )}
                  <td
                    className={`tw-py-3.5 tw-pr-3 ${summary ? "" : "tw-pl-5"}`}
                  >
                    <TypeName row={row} />
                  </td>
                  <td className="tw-py-3.5 tw-pr-3 tw-text-iron-300">
                    <span className="tw-mr-2">{row.cpu}</span>
                    <ArchTag arch={row.arch} />
                  </td>
                  <td className="tw-whitespace-nowrap tw-py-3.5 tw-pr-3 tw-text-iron-300">
                    {row.size}
                  </td>
                  <td className="tw-py-3.5 tw-pr-3 tw-text-iron-300">
                    {row.disk}
                  </td>
                  <td className="tw-py-3.5 tw-pr-3 tw-text-iron-300">
                    {row.burst}
                  </td>
                  <td className="tw-py-3.5 tw-pr-5 tw-text-right">
                    <Total row={row} copy={copy} showMachine={!summary} />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <ul
          className="tw-m-0 tw-list-none tw-p-0 lg:tw-hidden"
          aria-label={copy.caption}
        >
          {rows.map(({ provider, row }) =>
            row === null ? (
              <li
                key={`${provider.id}-none`}
                className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-px-4 tw-py-3.5 tw-text-[15px] tw-text-iron-400 first:tw-border-t-0 md:tw-px-5"
              >
                {noneText(provider)}
              </li>
            ) : (
              <li
                key={`${provider.id}-${row.id}`}
                data-fact={factOf(provider, row)}
                title={titleOf(provider)}
                className={`tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-px-4 tw-py-4 first:tw-border-t-0 md:tw-px-5 ${row.orderable ? "" : "tw-opacity-60"}`}
              >
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
                  <div className="tw-min-w-0">
                    {summary && (
                      <span className="tw-block tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50">
                        {provider.name}
                      </span>
                    )}
                    <TypeName row={row} />
                  </div>
                  <div className="tw-flex-none tw-text-right">
                    <Total row={row} copy={copy} showMachine={!summary} />
                  </div>
                </div>
                <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-[22px] tw-text-iron-300">
                  <ArchTag arch={row.arch} /> {row.cpu} · {row.size}
                </p>
                <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-[22px] tw-text-iron-400">
                  {row.disk} · {copy.cols.burst}: {row.burst}
                </p>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-4 md:tw-px-5">
        {summary ? (
          <p className="tw-m-0 tw-text-sm tw-leading-[22px] tw-text-iron-300">
            {copy.allNote}
          </p>
        ) : (
          current && (
            <ul className="tw-m-0 tw-flex tw-list-disc tw-flex-col tw-gap-1 tw-pl-4 tw-text-sm tw-leading-[22px] tw-text-iron-300 marker:tw-text-iron-600">
              <li>
                <b className="tw-font-semibold tw-text-iron-50">
                  {copy.region}:
                </b>{" "}
                {current.region}
              </li>
              {current.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )
        )}
        <p className="tw-m-0 tw-mt-2.5 tw-text-[13px] tw-font-medium tw-leading-5 tw-text-iron-400">
          {copy.source}: {info?.line}
        </p>
      </div>
    </div>
  );
}
