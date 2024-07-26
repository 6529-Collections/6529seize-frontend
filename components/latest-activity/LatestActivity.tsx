import styles from "./LatestActivity.module.scss";
import homeStyles from "../../styles/Home.module.scss";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table, Dropdown } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import { Transaction } from "../../entities/ITransaction";
import Pagination from "../pagination/Pagination";
import LatestActivityRow from "./LatestActivityRow";
import { NFT } from "../../entities/INFT";
import { areEqualAddresses, isNextgenContract } from "../../helpers/Helpers";
import { fetchAllPages, fetchUrl } from "../../services/6529api";
import DotLoader from "../dotLoader/DotLoader";
import { commonApiFetch } from "../../services/api/common-api";
import { NextGenCollection } from "../../entities/INextgen";
import { normalizeNextgenTokenID } from "../nextGen/nextgen_helpers";
import { GRADIENT_CONTRACT, MEMES_CONTRACT } from "../../constants";
import { NEXTGEN_CORE, NEXTGEN_CHAIN_ID } from "../nextGen/nextgen_contracts";
import useIsMobileScreen from "../../hooks/isMobileScreen";

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

enum ContractFilter {
  ALL = "All",
  MEMES = "Memes",
  NEXTGEN = "NextGen",
  GRADIENTS = "Gradients",
}

export default function LatestActivity(props: Readonly<Props>) {
  const isMobile = useIsMobileScreen();
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [page, setPage] = useState(props.page);
  const [showViewAll, setShowViewAll] = useState(false);

  useEffect(() => {
    setShowViewAll(!window.location.pathname.includes("nft-activity"));
  }, []);
  const [totalResults, setTotalResults] = useState(0);

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [nextgenCollections, setNextgenCollections] = useState<
    NextGenCollection[]
  >([]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(TypeFilter.ALL);
  const [selectedContract, setSelectedContract] = useState<ContractFilter>(
    ContractFilter.ALL
  );
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
    switch (selectedContract) {
      case ContractFilter.MEMES:
        url += `&contract=${MEMES_CONTRACT}`;
        break;
      case ContractFilter.NEXTGEN:
        url += `&contract=${NEXTGEN_CORE[NEXTGEN_CHAIN_ID]}`;
        break;
      case ContractFilter.GRADIENTS:
        url += `&contract=${GRADIENT_CONTRACT}`;
        break;
    }
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setActivity(response.data);
      setFetching(false);
    });
  }, [page, typeFilter, selectedContract]);

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

  useEffect(() => {
    commonApiFetch<{
      count: number;
      page: number;
      next: any;
      data: NextGenCollection[];
    }>({
      endpoint: `nextgen/collections`,
    }).then((response) => {
      setNextgenCollections(response.data);
    });
  }, []);

  return (
    <Container className={`no-padding pt-4`}>
      <Row className="d-flex align-items-center">
        <Col
          sm={12}
          md={6}
          className="d-flex align-items-center justify-content-between">
          <span className="d-flex flex-wrap align-items-center gap-3">
            <h1>
              <span className="font-lightest">NFT</span> Activity{" "}
            </h1>
            {showViewAll ? (
              <a href="/nft-activity" className={homeStyles.viewAllLink}>
                <span>View All</span>
              </a>
            ) : (
              fetching && <DotLoader />
            )}
          </span>
        </Col>
        <Col
          sm={12}
          md={6}
          className={`d-flex align-items-center gap-4 ${
            isMobile ? "justify-content-center" : "justify-content-end"
          }`}>
          <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
            <Dropdown.Toggle>Collection: {selectedContract}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(ContractFilter).map((contract) => (
                <Dropdown.Item
                  key={contract}
                  onClick={() => {
                    setPage(1);
                    setSelectedContract(contract);
                  }}>
                  {contract}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
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
                  let nft = undefined;
                  let nextgenCollection = undefined;
                  if (isNextgenContract(tr.contract)) {
                    const normalized = normalizeNextgenTokenID(tr.token_id);
                    nextgenCollection = nextgenCollections.find(
                      (c) => c.id === normalized.collection_id
                    );
                  } else {
                    nft = nfts.find(
                      (n) =>
                        n.id === tr.token_id &&
                        areEqualAddresses(n.contract, tr.contract)
                    );
                  }

                  return (
                    <LatestActivityRow
                      nft={nft}
                      nextgen_collection={nextgenCollection}
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
