import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Dropdown } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import styles from "./LatestActivity.module.scss";
import { Transaction } from "../../entities/ITransaction";
import Pagination from "../pagination/Pagination";
import LatestActivityRow from "./LatestActivityRow";
import { useRouter } from "next/router";
import { NFT } from "../../entities/INFT";
import { areEqualAddresses } from "../../helpers/Helpers";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import DotLoader from "../dotLoader/DotLoader";

interface Props {
  page: number;
  pageSize: number;
  showMore?: boolean;
}

export enum TypeFilter {
  ALL = "All",
  AIRDROPS = "Airdrops",
  MINTS = "Mints",
  SALES = "Sales",
  TRANSFERS = "Transfers",
  BURNS = "Burns",
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

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(TypeFilter.ALL);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setFetching(true);
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
      case TypeFilter.MINTS:
        url += `&filter=mints`;
        break;
      case TypeFilter.BURNS:
        url += `&filter=burns`;
        break;
    }
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setNext(response.next);
      setActivity(response.data);
      setFetching(false);
    });
  }, [page, typeFilter]);

  useEffect(() => {
    fetchUrl(`${process.env.API_ENDPOINT}/api/memes_lite`).then(
      (memeResponse: DBResponse) => {
        setNfts(memeResponse.data);
        fetchAllPages(
          `${process.env.API_ENDPOINT}/api/nfts/gradients?&page_size=101`
        ).then((gradients: NFT[]) => {
          setNfts([...memeResponse.data, ...gradients]);
        });
      }
    );
  }, []);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <Col className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            <h1>
              LATEST ACTIVITY{" "}
              {showViewAll ? (
                <a href="/latest-activity">
                  <span className={styles.viewAllLink}>VIEW ALL</span>
                </a>
              ) : (
                fetching && <DotLoader />
              )}
            </h1>
          </span>
          <span>
            <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
              <Dropdown.Toggle>Filter: {typeFilter}</Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.values(TypeFilter).map((filter) => (
                  <Dropdown.Item
                    key={filter}
                    onClick={() => {
                      setPage(1);
                      setTypeFilter(filter);
                    }}>
                    {filter}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </span>
        </Col>
      </Row>
      {fetching && showViewAll && <DotLoader />}
      <Row className={`pt-3 ${styles.scrollContainer}`}>
        <Col>
          <Table bordered={false} className={styles.activityTable}>
            <tbody>
              {activity &&
                nfts &&
                activity.map((tr) => {
                  const nft = nfts.find(
                    (n) =>
                      n.id === tr.token_id &&
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
