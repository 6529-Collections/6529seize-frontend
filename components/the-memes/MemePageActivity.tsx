"use client";

import LatestActivityRow from "@/components/latest-activity/LatestActivityRow";
import Pagination from "@/components/pagination/Pagination";
import { publicEnv } from "@/config/env";
import { MEMES_CONTRACT } from "@/constants";
import { DBResponse } from "@/entities/IDBResponse";
import { NFT } from "@/entities/INFT";
import { Transaction } from "@/entities/ITransaction";
import { numberWithCommas } from "@/helpers/Helpers";
import { TypeFilter } from "@/hooks/useActivityData";
import { fetchUrl } from "@/services/6529api";
import { useEffect, useState } from "react";
import { Col, Container, Dropdown, Row, Table } from "react-bootstrap";
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

  useEffect(() => {
    if (!props.show || !props.nft?.id) {
      setActivityTotalResults(0);
      setActivity([]);
      return;
    }
    let cancelled = false;

    if (props.nft?.id) {
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
        <Row className="pt-3">
          <Col
            className="d-flex align-items-center"
            xs={{ span: 7 }}
            sm={{ span: 7 }}
            md={{ span: 9 }}
            lg={{ span: 10 }}>
            <h3>Card Activity</h3>
          </Col>
          <Col
            xs={{ span: 5 }}
            sm={{ span: 5 }}
            md={{ span: 3 }}
            lg={{ span: 2 }}>
            <Dropdown
              className={styles.activityFilterDropdown}
              drop={"down-centered"}>
              <Dropdown.Toggle>Filter: {activityTypeFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(TypeFilter).map((filter) => (
                  <Dropdown.Item
                    key={`nft-activity-${filter}`}
                    onClick={() => {
                      setActivityPage(1);
                      setActivityTypeFilter(filter);
                    }}>
                    {filter}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        <Row className={`pt-2 ${styles.transactionsScrollContainer}`}>
          <Col>
            <Table bordered={false} className={styles.transactionsTable}>
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
          </Col>
        </Row>
        {activity.length > 0 && (
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