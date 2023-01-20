import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Dropdown } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import styles from "./LatestActivity.module.scss";
import dynamic from "next/dynamic";
import { Transaction } from "../../entities/ITransaction";
import Pagination from "../pagination/Pagination";
import LatestActivityRow from "./LatestActivityRow";
import { useRouter } from "next/router";
import { NFT } from "../../entities/INFT";
import { areEqualAddresses } from "../../helpers/Helpers";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
}

enum TypeFilter {
  ALL = "All",
  SALES = "Sales",
  TRANSFERS = "Transfers",
  AIRDROPS = "Airdrops",
}

export default function LatestActivity(props: Props) {
  const router = useRouter();
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [page, setPage] = useState(props.page);
  const [next, setNext] = useState(null);
  const [showViewAll, setShowViewAll] = useState(
    !window.location.pathname.includes("latest-activity")
  );
  const [totalResults, setTotalResults] = useState(0);

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nftsLoaded, setNftsLoaded] = useState(false);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(TypeFilter.ALL);

  useEffect(() => {
    let url = `${process.env.API_ENDPOINT}/api/transactions?page_size=${props.pageSize}&page=${page}`;
    switch (typeFilter) {
      case TypeFilter.SALES:
        url += `&filter=sales`;
        break;
      case TypeFilter.TRANSFERS:
        url += `&filter=transfers`;
        break;
      case TypeFilter.AIRDROPS:
        url += `&filter=airdrops`;
        break;
    }
    fetch(url)
      .then((res) => res.json())
      .then((response: DBResponse) => {
        setTotalResults(response.count);
        setNext(response.next);
        setActivity(response.data);
      });
  }, [page, typeFilter]);

  useEffect(() => {
    async function fetchNfts(url: string, mynfts: NFT[]) {
      return fetch(url)
        .then((res) => res.json())
        .then((response: DBResponse) => {
          if (response.next) {
            fetchNfts(response.next, [...mynfts].concat(response.data));
          } else {
            const newnfts = [...mynfts]
              .concat(response.data)
              .filter((value, index, self) => {
                return self.findIndex((v) => v.id === value.id) === index;
              });

            setNfts(
              [...newnfts].map((n) => {
                return n;
              })
            );
            setNftsLoaded(true);
          }
        });
    }
    if (router.isReady) {
      const initialUrlNfts = `${process.env.API_ENDPOINT}/api/nfts`;
      fetchNfts(initialUrlNfts, []);
    }
  }, [router.isReady]);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <Col
          xs={{ span: 12 }}
          sm={{ span: 7 }}
          md={{ span: 9 }}
          lg={{ span: 9 }}>
          <h1>
            LATEST ACTIVITY{" "}
            {showViewAll && (
              <a href="/latest-activity">
                <span className={styles.viewAllLink}>VIEW ALL</span>
              </a>
            )}
          </h1>
        </Col>
        {!showViewAll && (
          <Col
            xs={{ span: 12 }}
            sm={{ span: 5 }}
            md={{ span: 3 }}
            lg={{ span: 3 }}
            className={`d-flex justify-content-center align-items-center`}>
            <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
              <Dropdown.Toggle>Filter: {typeFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(TypeFilter).map((filter) => (
                  <Dropdown.Item
                    key={TypeFilter.ALL}
                    onClick={() => setTypeFilter(filter)}>
                    {filter}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        )}
      </Row>
      <Row className={styles.scrollContainer}>
        <Col>
          <Table bordered={false} className={styles.activityTable}>
            <tbody>
              {activity &&
                nfts &&
                activity.map((tr) => {
                  const nft = nfts.find(
                    (n) =>
                      n.id == tr.token_id &&
                      areEqualAddresses(n.contract, tr.contract)
                  );
                  return (
                    <LatestActivityRow
                      nft={nft}
                      tr={tr}
                      key={`${tr.from_address}-${tr.to_address}-${tr.transaction}-${tr.token_id}`}
                    />
                  );
                })}
            </tbody>
          </Table>
        </Col>
      </Row>
      {props.showMore && totalResults > 0 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={page}
            pageSize={props.pageSize}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
              window.scrollTo(0, 0);
            }}
          />
        </Row>
      )}
    </Container>
  );
}
