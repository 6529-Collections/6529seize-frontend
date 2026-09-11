"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  NextGenCollection,
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "@/entities/INextgen";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { commonApiFetch } from "@/services/api/common-api";
import Pagination from "@/components/pagination/Pagination";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import NextGenCollectionHeader, {
  NextGenBackToCollectionPageLink,
} from "../NextGenCollectionHeader";
import { getJsonData } from "./NextGenMintWidget";

const PdfViewer = dynamic(() => import("../../../../pdfViewer/PdfViewer"), {
  ssr: false,
});

interface Props {
  collection: NextGenCollection;
}

const PAGE_SIZE = 100;

export default function NextgenCollectionMintingPlan(props: Readonly<Props>) {
  const [phasesSet, setPhasesSet] = useState(false);
  const [phases, setPhases] = useState<NextgenAllowlistCollection[]>([]);

  const [selectedPhase, setSelectedPhase] =
    useState<NextgenAllowlistCollection>();

  const allowlistScrollTarget = useRef<HTMLElement>(null);
  const [allowlist, setAllowlist] = useState<NextgenAllowlist[]>([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [allowlistLoaded, setAllowlistLoaded] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

  function adjustSpots(address: string, keccak: string) {
    const addressEntries = allowlist.filter((al) =>
      areEqualAddresses(al.address, address)
    );
    const index = addressEntries.findIndex((al) => al.keccak === keccak);
    let returnSpots = addressEntries[index]?.spots;
    if (index > 0) {
      returnSpots =
        addressEntries[index]?.spots! - addressEntries[index - 1]?.spots!;
    }
    return returnSpots;
  }

  useEffect(() => {
    commonApiFetch<NextgenAllowlistCollection[]>({
      endpoint: `nextgen/allowlist_phases/${props.collection.id}?page_size=250`,
    }).then((collections) => {
      setPhases(collections.toSorted((a, b) => a.start_time - b.start_time));
      setPhasesSet(true);
    });
  }, []);

  function fetchAllowlist(mypage: number) {
    setAllowlistLoaded(false);
    const filters = [];
    if (searchWallets.length > 0) {
      filters.push(`&address=${searchWallets.join(",")}`);
    }
    commonApiFetch<{
      count: number;
      page: number;
      next: unknown;
      data: NextgenAllowlist[];
    }>({
      endpoint: `nextgen/${props.collection.id}/allowlist_merkle/${
        selectedPhase?.merkle_root ?? ""
      }?page_size=${PAGE_SIZE}&page=${mypage}${filters}`,
    }).then((response) => {
      setTotalResults(response.count);
      setAllowlist(response.data);
      setAllowlistLoaded(true);
    });
  }

  useEffect(() => {
    fetchAllowlist(page);
  }, [page]);

  useEffect(() => {
    if (page > 1) {
      setPage(1);
    } else {
      fetchAllowlist(1);
    }
  }, [selectedPhase, searchWallets]);

  function printPhaseDateTime(date: Time) {
    if (date.toMillis() === 0) {
      return <span className="tw-font-semibold tw-text-white">N/A</span>;
    }
    return (
      <span className="tw-font-semibold tw-text-white">
        {date.toIsoDateString()} {date.toIsoTimeString()}
      </span>
    );
  }

  function printPhase(phaseName: string, start: number, end: number) {
    const startTime = Time.seconds(start);
    const endTime = Time.seconds(end);
    return (
      <article
        key={`${phaseName}-${start}-${end}`}
        className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-5"
      >
        <h3 className="tw-mb-4 tw-mt-0 tw-text-lg tw-font-semibold tw-text-white">
          {phaseName}
        </h3>
        <dl className="tw-m-0 tw-grid tw-gap-3">
          <div className="tw-grid tw-gap-1">
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              Start
            </dt>
            <dd className="tw-m-0 tw-text-sm">
              {printPhaseDateTime(startTime)}
            </dd>
          </div>
          <div className="tw-grid tw-gap-1">
            <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400">
              End
            </dt>
            <dd className="tw-m-0 tw-text-sm">{printPhaseDateTime(endTime)}</dd>
          </div>
        </dl>
      </article>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-[1400px] tw-px-4 tw-pb-12 md:tw-px-6 lg:tw-px-8">
      <section className="tw-py-6 sm:tw-py-8">
        <NextGenBackToCollectionPageLink collection={props.collection} />
        <div className="tw-mt-2">
          <NextGenCollectionHeader
            collection={props.collection}
            contained={false}
            compact={true}
            show_links={true}
          />
        </div>
      </section>

      <section>
        <h2 className="tw-mb-5 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
          Distribution Plan
        </h2>
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
          <h3 className="tw-col-span-full tw-mb-0 tw-text-lg tw-font-semibold tw-text-white">
            Phases
          </h3>
          {phases.map((phase) =>
            printPhase(phase.phase, phase.start_time, phase.end_time)
          )}
          {phasesSet &&
            printPhase(
              "Public Phase",
              props.collection.public_start,
              props.collection.public_end
            )}
        </div>
      </section>

      {props.collection.distribution_plan && (
        <section className="tw-pt-8">
          <PdfViewer
            file={props.collection.distribution_plan}
            name={`${props.collection.name} Distribution Plan`}
          />
        </section>
      )}

      <section className="tw-pt-8" ref={allowlistScrollTarget}>
        <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-white">
            Allowlist
          </h3>
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center">
            <label className="tw-grid tw-gap-1">
              <span className="tw-sr-only">Filter by phase</span>
              <select
                value={selectedPhase?.phase ?? ""}
                onChange={(event) => {
                  const nextPhase = phases.find(
                    (phase) => phase.phase === event.target.value
                  );
                  setSelectedPhase(nextPhase);
                }}
                className="tw-[color-scheme:dark] tw-min-h-11 tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-base tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <option value="" className="tw-bg-black tw-text-white">
                  All Phases
                </option>
                {phases.map((p) => (
                  <option
                    key={`filter-${p.phase}`}
                    value={p.phase}
                    className="tw-bg-black tw-text-white"
                  >
                    {p.phase}
                  </option>
                ))}
              </select>
            </label>
            <SearchWalletsDisplay
              searchWallets={searchWallets}
              setSearchWallets={setSearchWallets}
              setShowSearchModal={setShowSearchModal}
            />
          </div>
        </div>

        <div className="tw-no-scrollbar tw-overflow-x-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80">
          <table className="tw-w-full tw-min-w-[760px] tw-border-collapse">
            <thead>
              <tr className="tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-text-left tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
                <th className="tw-px-4 tw-py-3 tw-font-semibold">
                  Address ({totalResults.toLocaleString()})
                </th>
                <th className="tw-px-4 tw-py-3 tw-text-center tw-font-semibold">
                  Phase
                </th>
                <th className="tw-px-4 tw-py-3 tw-text-center tw-font-semibold">
                  Spots
                </th>
                <th className="tw-px-4 tw-py-3 tw-text-center tw-font-semibold">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {!allowlistLoaded && (
                <tr>
                  <td
                    colSpan={4}
                    className="tw-px-4 tw-py-8 tw-text-center tw-text-iron-400"
                  >
                    Loading allowlist…
                  </td>
                </tr>
              )}
              {allowlistLoaded && allowlist.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="tw-px-4 tw-py-8 tw-text-center tw-text-iron-400"
                  >
                    No allowlist entries match these filters.
                  </td>
                </tr>
              )}
              {allowlistLoaded &&
                allowlist.map((al) => (
                  <tr
                    key={`${al.address}-${al.spots}-${al.info}`}
                    className="tw-border-0 tw-border-b tw-border-solid tw-border-white/5 last:tw-border-b-0 hover:tw-bg-white/[0.03]"
                  >
                    <td className="tw-px-4 tw-py-3">
                      <Link
                        href={`/${al.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tw-no-underline hover:tw-underline"
                      >
                        {al.wallet_display && `${al.wallet_display} - `}
                        {al.address}
                      </Link>
                    </td>
                    <td className="tw-px-4 tw-py-3 tw-text-center">
                      {al.phase}
                    </td>
                    <td className="tw-px-4 tw-py-3 tw-text-center">
                      {adjustSpots(al.address, al.keccak)}
                    </td>
                    <td className="tw-px-4 tw-py-3">
                      <div className="tw-flex tw-justify-center">
                        {getJsonData(al.keccak, al.info)}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {totalResults > PAGE_SIZE && allowlistLoaded && (
          <div className="tw-py-5 tw-text-center">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalResults={totalResults}
              setPage={function (newPage: number) {
                setPage(newPage);
                if (allowlistScrollTarget.current) {
                  allowlistScrollTarget.current.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
            />
          </div>
        )}
      </section>
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </div>
  );
}
