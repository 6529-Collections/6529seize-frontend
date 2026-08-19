"use client";

import { useEffect, useState } from "react";
import Pagination from "../pagination/Pagination";
import { NETWORK_PAGE_TITLE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { Time } from "@/helpers/time";
import {
  faCheckCircle,
  faLocationDot,
  faMinusCircle,
  faWarning,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { getDateDisplay } from "@/helpers/Helpers";
import { useSetTitle } from "@/contexts/TitleContext";
import { useAuth } from "../auth/Auth";

interface Prenode {
  ip: string;
  domain: string | null;
  city: string;
  country: string;
  tdh_sync: boolean;
  ping_status: "green" | "orange" | "red";
  block_sync: boolean;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 20;
const PRENODE_CARD_CLASS =
  "tw-h-full tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-p-4 tw-transition-colors tw-duration-200 group-hover:tw-border-iron-700 group-hover:tw-bg-iron-950 sm:tw-p-5";
const STATUS_CLASSNAMES = {
  error: "tw-text-error",
  success: "tw-text-success",
  unknown: "tw-text-iron-600",
  warning: "tw-text-amber-300",
} as const;
type StatusClassName =
  (typeof STATUS_CLASSNAMES)[keyof typeof STATUS_CLASSNAMES];

function getSyncStatusLabel(name: string, isSynced: boolean, known: boolean) {
  if (!known) {
    return `${name}: unknown`;
  }

  return isSynced ? `${name}: synced` : `${name}: not synced`;
}

export default function PrenodesStatus() {
  useSetTitle("Prenodes | Network");

  const { connectedProfile } = useAuth();

  const [page, setPage] = useState<number>(1);

  const [prenodes, setPrenodes] = useState<Prenode[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      const url = `https://api.6529.io/oracle/prenodes?page=${page}&page_size=${PAGE_SIZE}`;
      const response = await fetch(url);
      const result = (await response.json()) as {
        data: Prenode[];
        count: number;
      };
      setPrenodes(result.data);
      setTotalResults(result.count);
    };

    void fetchResults().catch(() => undefined);
  }, [page]);

  function printLocation(prenode: Prenode) {
    let location = "";
    if (prenode.city) {
      location += prenode.city;
    }
    if (prenode.city && prenode.country) {
      location += ", ";
    }
    if (prenode.country) {
      location += prenode.country;
    }

    if (!location) {
      location = "Unknown";
    }
    return (
      <div className="tw-mt-3 tw-flex tw-min-w-0 tw-items-start tw-gap-2 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
        <FontAwesomeIcon
          icon={faLocationDot}
          className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-500"
          aria-hidden="true"
        />
        <span className="tw-min-w-0 tw-break-words">{location}</span>
      </div>
    );
  }

  function printStatusIcon(icon: IconProp, status: string, label: string) {
    return (
      <span
        aria-label={label}
        className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/[0.03] tw-ring-1 tw-ring-inset tw-ring-white/[0.06]"
        role="img"
      >
        <FontAwesomeIcon
          icon={icon}
          className={`${status} tw-size-4`}
          aria-hidden="true"
        />
      </span>
    );
  }

  function getPingStatusLabel(status: Prenode["ping_status"]) {
    switch (status) {
      case "green":
        return "Ping status: healthy";
      case "orange":
        return "Ping status: warning";
      case "red":
        return "Ping status: failing";
    }
  }

  function printPrenode(prenode: Prenode) {
    const prenodeHost =
      prenode.domain !== null && prenode.domain.length > 0
        ? prenode.domain
        : prenode.ip;
    const prenodeKey = `${prenode.ip}-${prenode.domain ?? ""}`;
    let href = `https://${prenodeHost}/oracle`;
    if (connectedProfile?.primary_wallet) {
      href += `/address/${connectedProfile.primary_wallet}`;
    } else {
      href += "/tdh/total";
    }

    const createdAt: Time = Time.fromString(prenode.created_at.toString());
    const updatedAt: Time = Time.fromString(prenode.updated_at.toString());

    let updatedAtStatus: StatusClassName = STATUS_CLASSNAMES.error;
    let updatedAtIcon = faXmarkCircle;
    let tdhStatus: StatusClassName = STATUS_CLASSNAMES.unknown;
    let tdhIcon = faMinusCircle;
    let blockStatus: StatusClassName = STATUS_CLASSNAMES.unknown;
    let blockIcon = faMinusCircle;
    if (prenode.ping_status === "green") {
      updatedAtStatus = STATUS_CLASSNAMES.success;
      updatedAtIcon = faCheckCircle;
      tdhIcon = prenode.tdh_sync ? faCheckCircle : faXmarkCircle;
      tdhStatus = prenode.tdh_sync
        ? STATUS_CLASSNAMES.success
        : STATUS_CLASSNAMES.error;
      blockIcon = prenode.block_sync ? faCheckCircle : faXmarkCircle;
      blockStatus = prenode.block_sync
        ? STATUS_CLASSNAMES.success
        : STATUS_CLASSNAMES.error;
    } else if (prenode.ping_status === "orange") {
      updatedAtStatus = STATUS_CLASSNAMES.warning;
      updatedAtIcon = faWarning;
    }

    return (
      <div className="tw-w-full" key={prenodeKey}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-group tw-block tw-h-full tw-rounded-xl tw-text-inherit tw-no-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-[#0D0D0F]"
        >
          <article className={PRENODE_CARD_CLASS}>
            <header className="tw-min-w-0">
              <h2 className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
                {prenodeHost}
              </h2>
              <p className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
                {prenode.ip}
              </p>
            </header>
            {printLocation(prenode)}
            <div className="tw-mt-5 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/20">
              <dl aria-label={`${prenodeHost} timestamps`} className="tw-m-0">
                <div className="tw-grid tw-grid-cols-1 tw-gap-1 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-px-3 tw-py-3 sm:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:tw-items-center sm:tw-gap-3">
                  <dt className="tw-text-[11px] tw-font-normal tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-400">
                    Register Date
                  </dt>
                  <dd className="tw-m-0 tw-break-words tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-300 sm:tw-text-right">
                    <b className="tw-font-medium tw-text-iron-100">
                      {createdAt.toIsoDateTimeString()}
                    </b>{" "}
                    ({getDateDisplay(createdAt.toDate())})
                  </dd>
                </div>
                <div className="tw-grid tw-grid-cols-1 tw-gap-1 tw-px-3 tw-py-3 sm:tw-grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:tw-items-center sm:tw-gap-3">
                  <dt className="tw-text-[11px] tw-font-normal tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-400">
                    Last Update
                  </dt>
                  <dd className="tw-m-0 tw-break-words tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-300 sm:tw-text-right">
                    <b className="tw-font-medium tw-text-iron-100">
                      {updatedAt.toIsoDateTimeString()}
                    </b>{" "}
                    ({getDateDisplay(updatedAt.toDate())})
                  </dd>
                </div>
              </dl>
            </div>
            <div className="tw-mt-3 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-black/20">
              <dl aria-label={`${prenodeHost} status`} className="tw-m-0">
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-px-3 tw-py-2">
                  <dt className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
                    Ping Status
                  </dt>
                  <dd className="tw-m-0 tw-flex-shrink-0">
                    {printStatusIcon(
                      updatedAtIcon,
                      updatedAtStatus,
                      getPingStatusLabel(prenode.ping_status)
                    )}
                  </dd>
                </div>
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-px-3 tw-py-2">
                  <dt className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
                    TDH Status
                  </dt>
                  <dd className="tw-m-0 tw-flex-shrink-0">
                    {printStatusIcon(
                      tdhIcon,
                      tdhStatus,
                      getSyncStatusLabel(
                        "TDH status",
                        prenode.tdh_sync,
                        prenode.ping_status === "green"
                      )
                    )}
                  </dd>
                </div>
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-px-3 tw-py-2">
                  <dt className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-300">
                    TDH Block Status
                  </dt>
                  <dd className="tw-m-0 tw-flex-shrink-0">
                    {printStatusIcon(
                      blockIcon,
                      blockStatus,
                      getSyncStatusLabel(
                        "TDH block status",
                        prenode.block_sync,
                        prenode.ping_status === "green"
                      )
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </article>
        </a>
      </div>
    );
  }

  function printPrenodes() {
    if (prenodes.length === 0) {
      return;
    }

    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 lg:tw-gap-5">
        {prenodes.map((prenode: Prenode) => printPrenode(prenode))}
      </div>
    );
  }

  return (
    <section className="tw-pb-12">
      <header className="tw-pb-8 sm:tw-pb-10">
        <h1 className={NETWORK_PAGE_TITLE_CLASSES}>Prenodes Status</h1>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400">
          * All times are in UTC
        </p>
      </header>
      {printPrenodes()}
      {totalResults > 0 && totalResults / PAGE_SIZE > 1 && (
        <div className="tw-mt-8 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-pb-3 tw-pt-6 tw-text-center">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </div>
      )}
    </section>
  );
}
