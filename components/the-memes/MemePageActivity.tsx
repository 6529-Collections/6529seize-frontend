"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { ActivityTypeItems } from "@/components/latest-activity/ActivityFilters";
import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import Pagination from "@/components/pagination/Pagination";
import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NFT } from "@/entities/INFT";
import type { Transaction } from "@/entities/ITransaction";
import { numberWithCommas } from "@/helpers/Helpers";
import { TypeFilter } from "@/hooks/useActivityData";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useMemo, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import styles from "./TheMemes.module.scss";

export function MemePageActivity(
  props: Readonly<{
    show: boolean;
    nft: NFT | undefined;
    pageSize: number;
  }>
) {
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalResults, setActivityTotalResults] = useState(0);
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<TypeFilter>(
    TypeFilter.ALL
  );
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!props.show || !props.nft?.id) {
      setActivityTotalResults(0);
      setActivity([]);
      return;
    }
    let cancelled = false;

    if (props.nft?.id) {
      setActivityLoading(true);
      let url = `${publicEnv.API_ENDPOINT}/api/transactions?contract=${MEMES_CONTRACT}&id=${props.nft.id}&page_size=${props.pageSize}&page=${activityPage}`;
      switch (activityTypeFilter) {
        case TypeFilter.SALES:
          url += `&filter=sales`;
          break;
        case TypeFilter.TRANSFERS:
          url += `&filter=transfers`;
          break;
        case TypeFilter.AIRDROPS:
          url += `&filter=airdrops`;
          break;
        case TypeFilter.MINTS:
          url += `&filter=mints`;
          break;
        case TypeFilter.BURNS:
          url += `&filter=burns`;
          break;
      }
      fetchUrl(url)
        .then((response: DBResponse) => {
          if (cancelled) return;
          setActivityTotalResults(response.count ?? 0);
          setActivity(response.data ?? []);
        })
        .catch(() => {
          if (cancelled) return;
          setActivityTotalResults(0);
          setActivity([]);
        })
        .finally(() => {
          setActivityLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [
    props.show,
    props.nft?.id,
    props.pageSize,
    activityPage,
    activityTypeFilter,
  ]);

  const activityContent = useMemo(() => {
    if (activity.length > 0) {
      return (
        <Table bordered={false} className={styles["transactionsTable"]}>
          <tbody>
            {activity.map((tr) => (
              <LatestActivityRow
                tr={tr}
                nft={props.nft}
                key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
              />
            ))}
          </tbody>
        </Table>
      );
    }

    if (activityLoading) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
          <CircleLoader size={CircleLoaderSize.LARGE} />
        </div>
      );
    }

    if (activity.length === 0) {
      return (
        <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-py-2">
          <NothingHereYetSummer />
        </div>
      );
    }
    return;
  }, [activity, activityLoading, props.nft]);

  if (props.show && props.nft) {
    return (
      <Container className="p-0">
        {props.nft && (
          <>
            <Row className="pt-2">
              <Col>
                <h3>Card Volumes</h3>
              </Col>
            </Row>
            <Row className="pt-2">
              <Col>
                <Table className="text-center">
                  <thead>
                    <tr>
                      <th>24 Hours</th>
                      <th>7 Days</th>
                      <th>1 Month</th>
                      <th>All Time</th>
                    </tr>
                  </thead>
                  <tbody className="pt-3">
                    <tr>
                      <td>
                        {props.nft.total_volume_last_24_hours > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.nft.total_volume_last_24_hours * 100
                              ) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {props.nft.total_volume_last_7_days > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.nft.total_volume_last_7_days * 100
                              ) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {props.nft.total_volume_last_1_month > 0
                          ? `${numberWithCommas(
                              Math.round(
                                props.nft.total_volume_last_1_month * 100
                              ) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                      <td>
                        {props.nft.total_volume > 0
                          ? `${numberWithCommas(
                              Math.round(props.nft.total_volume * 100) / 100
                            )} ETH`
                          : `N/A`}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </>
        )}
        <Row className="tw-py-3">
          <Col>
            <div className="tw-flex tw-flex-col tw-items-stretch tw-justify-between tw-gap-3 md:tw-flex-row md:tw-items-center">
              <h3 className="tw-mb-0 tw-shrink-0 tw-whitespace-nowrap">
                Card Activity
              </h3>
              <div className="tw-w-full tw-shrink-0 md:tw-w-72">
                <CommonDropdown
                  items={ActivityTypeItems}
                  activeItem={activityTypeFilter}
                  filterLabel="Transaction Type"
                  setSelected={(filter) => {
                    setActivityPage(1);
                    setActivityTypeFilter(filter);
                  }}
                />
              </div>
            </div>
          </Col>
        </Row>
        <Row className={`pt-2 ${styles["transactionsScrollContainer"]}`}>
          <Col>{activityContent}</Col>
        </Row>
        {activity.length > 0 && !activityLoading && (
          <Row className="text-center pt-2 pb-3">
            <Pagination
              page={activityPage}
              pageSize={props.pageSize}
              totalResults={activityTotalResults}
              setPage={function (newPage: number) {
                setActivityPage(newPage);
                window.scrollTo(0, 0);
              }}
            />
          </Row>
        )}
      </Container>
    );
  } else {
    return <></>;
  }
}
