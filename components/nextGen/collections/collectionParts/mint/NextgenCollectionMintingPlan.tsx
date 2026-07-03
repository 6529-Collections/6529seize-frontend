"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  NextGenCollection,
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "@/entities/INextgen";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { commonApiFetch } from "@/services/api/common-api";
import Pagination from "@/components/pagination/Pagination";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "@/components/searchModal/SearchModal";
import styles from "@/components/nextGen/collections/NextGen.module.css";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
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

  const allowlistScrollTarget = useRef<HTMLDivElement>(null);
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
      next: any;
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
      return <b>N/A</b>;
    }
    return (
      <b>
        {date.toIsoDateString()} {date.toIsoTimeString()}
      </b>
    );
  }

  function printPhase(phaseName: string, start: number, end: number) {
    const startTime = Time.seconds(start);
    const endTime = Time.seconds(end);
    return (
      <div key={getRandomObjectId()} className="tw-flex tw-flex-col tw-py-2">
        <div className={styles["phaseBox"]}>
          <span className="tw-flex tw-items-center tw-justify-center tw-pb-4">
            <h4 className="tw-mb-0 tw-text-white">{phaseName}</h4>
          </span>
          <table className="tw-w-full">
            <tbody>
              <tr>
                <th scope="row" className="tw-flex tw-justify-center tw-gap-3">
                  <span>
                    <b>Start</b>
                  </span>
                  <span>{printPhaseDateTime(startTime)}</span>
                </th>
              </tr>
              <tr>
                <th scope="row" className="tw-flex tw-justify-center tw-gap-3">
                  <span>
                    <b>End</b>
                  </span>
                  <span>{printPhaseDateTime(endTime)}</span>
                </th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="tailwind-scope tw-mx-auto tw-w-full tw-px-3 tw-py-4 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] xl:tw-max-w-[1140px] 2xl:tw-max-w-[1320px]">
      <div className="tw-pb-4">
        <NextGenCollectionHeader
          collection={props.collection}
          collection_link={true}
        />
      </div>
      <div className="tw-pt-4">
        <h3 className="tw-mb-0">Distribution Plan</h3>
      </div>
      <hr />
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-6 tw-pt-3 sm:tw-grid-cols-2 md:tw-grid-cols-3">
        <div className="tw-col-span-full">
          <h2>Phases</h2>
        </div>
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
      {props.collection.distribution_plan && (
        <div className="tw-pt-3">
          <PdfViewer
            file={props.collection.distribution_plan}
            name={`${props.collection.name} Distribution Plan`}
          />
        </div>
      )}
      <div className="tw-pt-4" ref={allowlistScrollTarget}>
        <div className="tw-flex tw-items-center tw-justify-between">
          <label
            className={`${styles["filterDropdown"]} tw-flex tw-items-center tw-gap-2`}
          >
            <span className="tw-sr-only">Phase</span>
            <select
              value={selectedPhase?.phase ?? ""}
              onChange={(event) => {
                const nextPhase = phases.find(
                  (phase) => phase.phase === event.target.value
                );
                setSelectedPhase(nextPhase);
              }}
              className="tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-py-1 tw-pl-1 tw-pr-8 tw-text-lg tw-font-bold tw-text-white focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
              style={{ colorScheme: "dark" }}
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
      <div className="table-scroll-container">
        <table className={styles["logsTable"]}>
          <thead>
            <tr>
              <th>Address x{totalResults.toLocaleString()}</th>
              <th className="tw-text-center">Phase</th>
              <th className="tw-text-center">Spots</th>
              <th className="tw-text-center">Data</th>
            </tr>
          </thead>
          <tbody>
            {allowlist.map((al) => (
              <tr key={`${al.address}-${al.spots}-${al.info}`}>
                <td>
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
                <td className="tw-text-center">{al.phase}</td>
                <td className="tw-text-center">
                  {adjustSpots(al.address, al.keccak)}
                </td>
                <td className="tw-flex tw-justify-center">
                  {getJsonData(al.keccak, al.info)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalResults > PAGE_SIZE && allowlistLoaded && (
        <div className="tw-py-4 tw-text-center">
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
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </div>
  );
}
