"use client";

import styles from "./Prenodes.module.scss";
import { useEffect, useState } from "react";
import Pagination from "../pagination/Pagination";
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
      <div className="tw-flex tw-items-center tw-gap-2 tw-pt-1">
        <FontAwesomeIcon icon={faLocationDot} height={20} aria-hidden="true" />
        {location}
      </div>
    );
  }

  function printStatusIcon(icon: IconProp, status: string, label: string) {
    return (
      <span aria-label={label} role="img">
        <FontAwesomeIcon
          icon={icon}
          className={status}
          height={22}
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

    let updatedAtStatus = styles["error"];
    let updatedAtIcon = faXmarkCircle;
    let tdhStatus = styles["unknown"];
    let tdhIcon = faMinusCircle;
    let blockStatus = styles["unknown"];
    let blockIcon = faMinusCircle;
    if (prenode.ping_status === "green") {
      updatedAtStatus = styles["success"];
      updatedAtIcon = faCheckCircle;
      tdhIcon = prenode.tdh_sync ? faCheckCircle : faXmarkCircle;
      tdhStatus = prenode.tdh_sync ? styles["success"] : styles["error"];
      blockIcon = prenode.block_sync ? faCheckCircle : faXmarkCircle;
      blockStatus = prenode.block_sync ? styles["success"] : styles["error"];
    } else if (prenode.ping_status === "orange") {
      updatedAtStatus = styles["warning"];
      updatedAtIcon = faWarning;
    }

    return (
      <div className="tw-w-full" key={prenodeKey}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-no-underline"
        >
          <div className={styles["prenode"]}>
            <h5>{prenodeHost}</h5>
            <div className="tw-font-extralight">
              <i>{prenode.ip}</i>
            </div>
            {printLocation(prenode)}
            <div className="tw-pt-3">
              <table className="tw-mb-0 tw-w-full">
                <tbody>
                  <tr>
                    <th scope="row" className="tw-text-left tw-font-normal">
                      Register Date
                    </th>
                    <td>
                      <b>{createdAt.toIsoDateTimeString()}</b> (
                      {getDateDisplay(createdAt.toDate())})
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="tw-text-left tw-font-normal">
                      Last Update
                    </th>
                    <td>
                      <b>{updatedAt.toIsoDateTimeString()}</b> (
                      {getDateDisplay(updatedAt.toDate())})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tw-pt-3">
              <table className="tw-mb-0 tw-w-full">
                <tbody>
                  <tr>
                    <th scope="row" className="tw-text-left tw-font-normal">
                      Ping Status
                    </th>
                    <td>
                      {printStatusIcon(
                        updatedAtIcon,
                        updatedAtStatus!,
                        getPingStatusLabel(prenode.ping_status)
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="tw-text-left tw-font-normal">
                      TDH Status
                    </th>
                    <td>
                      {printStatusIcon(
                        tdhIcon,
                        tdhStatus!,
                        getSyncStatusLabel(
                          "TDH status",
                          prenode.tdh_sync,
                          prenode.ping_status === "green"
                        )
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="tw-text-left tw-font-normal">
                      TDH Block Status
                    </th>
                    <td>
                      {printStatusIcon(
                        blockIcon,
                        blockStatus!,
                        getSyncStatusLabel(
                          "TDH block status",
                          prenode.block_sync,
                          prenode.ping_status === "green"
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </a>
      </div>
    );
  }

  function printPrenodes() {
    if (prenodes.length === 0) {
      return;
    }

    return (
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 tw-pt-2 md:tw-grid-cols-2">
        {prenodes.map((prenode: Prenode) => printPrenode(prenode))}
      </div>
    );
  }

  return (
    <section className="tw-p-0 tw-py-4">
      <div className="tw-pb-3">
        <h1>Prenodes Status </h1>
      </div>
      <div className="tw-text-[#9a9a9a]">* All times are in UTC</div>
      {printPrenodes()}
      {totalResults > 0 && totalResults / PAGE_SIZE > 1 && (
        <div className="tw-pb-3 tw-pt-2 tw-text-center">
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
