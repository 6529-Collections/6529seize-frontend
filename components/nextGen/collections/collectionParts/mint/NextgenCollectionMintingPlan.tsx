import styles from "../../NextGen.module.scss";
import { Col, Container, Dropdown, Row, Table } from "react-bootstrap";
import {
  NextGenCollection,
  NextgenAllowlist,
  NextgenAllowlistCollection,
} from "../../../../../entities/INextgen";
import NextGenCollectionHeader from "../NextGenCollectionHeader";
import { useEffect, useRef, useState } from "react";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { Time } from "../../../../../helpers/time";
import { getJsonData } from "./NextGenMintWidget";
import {
  areEqualAddresses,
  formatAddress,
} from "../../../../../helpers/Helpers";
import Pagination from "../../../../pagination/Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import SearchModal from "../../../../searchModal/SearchModal";
import PdfViewer from "../../../../pdfViewer/PdfViewer";

interface Props {
  collection: NextGenCollection;
}

const PAGE_SIZE = 100;

export default function NextgenCollectionMintingPlan(props: Readonly<Props>) {
  const [phases, setPhases] = useState<NextgenAllowlistCollection[]>([]);

  const [selectedPhase, setSelectedPhase] =
    useState<NextgenAllowlistCollection>();

  const allowlistScrollTarget = useRef<HTMLImageElement>(null);
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
    let returnSpots = addressEntries[index].spots;
    if (index > 0) {
      for (let i = 0; i < index; i++) {
        returnSpots -= addressEntries[i].spots;
      }
    }
    return returnSpots;
  }

  useEffect(() => {
    commonApiFetch<NextgenAllowlistCollection[]>({
      endpoint: `nextgen/allowlist_phases/${props.collection.id}?page_size=250`,
    }).then((collections) => {
      setPhases(collections);
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

  function printPhase(phaseName: string, start: number, end: number) {
    const startTime = Time.seconds(start);
    const endTime = Time.seconds(end);
    return (
      <Col>
        <span className="d-flex align-items-center justify-content-center pb-4">
          <h4 className="font-color mb-0">{phaseName}</h4>
        </span>
        <Table>
          <tbody>
            <tr>
              <td className="d-flex justify-content-center gap-3">
                <span>
                  <b>Start</b>
                </span>
                <span>
                  <b>
                    {startTime.toIsoDateString()} {startTime.toIsoTimeString()}
                  </b>
                </span>
              </td>
            </tr>
            <tr>
              <td className="d-flex justify-content-center gap-3">
                <span>
                  <b>End</b>
                </span>
                <span>
                  <b>
                    {endTime.toIsoDateString()} {endTime.toIsoTimeString()}
                  </b>
                </span>
              </td>
            </tr>
          </tbody>
        </Table>
      </Col>
    );
  }

  return (
    <Container className="pt-4 pb-4">
      <Row className="pb-4">
        <Col>
          <NextGenCollectionHeader
            collection={props.collection}
            collection_link={true}
          />
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <h3 className="mb-0">Distribution Plan</h3>
        </Col>
      </Row>
      <hr />
      <Row className="pt-3">
        <Col xs={12}>
          <h2>Phases</h2>
        </Col>
        {phases.map((phase) => (
          <Col
            xs={12}
            sm={6}
            md={4}
            key={phase.merkle_root}
            className="pt-2 pb-2 d-flex flex-column">
            <Container className={styles.phaseBox}>
              <Row>
                {printPhase(phase.phase, phase.start_time, phase.end_time)}
              </Row>
            </Container>
          </Col>
        ))}
        <Col xs={12} sm={6} md={4} className="pt-2 pb-2 d-flex flex-column">
          <Container className={styles.phaseBox}>
            <Row>
              {printPhase(
                "Public Phase",
                props.collection.public_start,
                props.collection.public_end
              )}
            </Row>
          </Container>
        </Col>
      </Row>
      {props.collection.distribution_plan && (
        <Row className="pt-3">
          <Col>
            <PdfViewer file={props.collection.distribution_plan} />
          </Col>
        </Row>
      )}
      {allowlist.length > 0 && (
        <>
          <Row className="pt-4" ref={allowlistScrollTarget}>
            <Col className="d-flex align-items-center justify-content-between">
              <Dropdown
                className={styles.filterDropdown}
                drop={"down-centered"}>
                <Dropdown.Toggle>
                  {selectedPhase?.phase ?? "All Phases"}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setSelectedPhase(undefined)}>
                    All Phases
                  </Dropdown.Item>
                  {phases.map((p) => (
                    <Dropdown.Item
                      key={`filter-${p.phase}`}
                      onClick={() => setSelectedPhase(p)}>
                      {p.phase}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <span className="d-flex flex-wrap align-items-center">
                {searchWallets.length > 0 &&
                  searchWallets.map((sw) => (
                    <span
                      className={styles.searchWalletDisplayWrapper}
                      key={sw}>
                      <Tippy
                        delay={250}
                        content={"Clear"}
                        placement={"top"}
                        theme={"light"}>
                        <button
                          className={`btn-link ${styles.searchWalletDisplayBtn}`}
                          onClick={() =>
                            setSearchWallets((sr) => sr.filter((s) => s != sw))
                          }>
                          x
                        </button>
                      </Tippy>
                      <span className={styles.searchWalletDisplay}>
                        {sw.endsWith(".eth") ? sw : formatAddress(sw)}
                      </span>
                    </span>
                  ))}
                {searchWallets.length > 0 && (
                  <Tippy
                    delay={250}
                    content={"Clear All"}
                    placement={"top"}
                    theme={"light"}>
                    <FontAwesomeIcon
                      onClick={() => setSearchWallets([])}
                      className={styles.clearSearchBtnIcon}
                      icon="times-circle"></FontAwesomeIcon>
                  </Tippy>
                )}
                <button
                  onClick={() => setShowSearchModal(true)}
                  className={`btn-link ${styles.searchBtn} ${
                    searchWallets.length > 0 ? styles.searchBtnActive : ""
                  } d-inline-flex align-items-center justify-content-center`}>
                  <FontAwesomeIcon
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    icon="search"></FontAwesomeIcon>
                </button>
              </span>
            </Col>
          </Row>
          <Row>
            <Col>
              <Table className={styles.logsTable}>
                <thead>
                  <tr>
                    <th>Address x{totalResults > 0 && totalResults}</th>
                    <th className="text-center">Phase</th>
                    <th className="text-center">Spots</th>
                    <th className="text-center">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {allowlist.map((al) => (
                    <tr key={`${al.address}-${al.spots}-${al.info}`}>
                      <td>
                        <a
                          href={`/${al.address}/mints`}
                          target="_blank"
                          rel="noreferrer"
                          className="decoration-hover-underline">
                          {al.wallet_display && `${al.wallet_display} - `}
                          {al.address}
                        </a>
                      </td>
                      <td className="text-center">{al.phase}</td>
                      <td className="text-center">
                        {adjustSpots(al.address, al.keccak)}
                      </td>
                      <td className="d-flex justify-content-center">
                        {getJsonData(al.keccak, al.info)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </>
      )}
      {totalResults > PAGE_SIZE && allowlistLoaded && (
        <Row className="text-center pt-4 pb-4">
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
        </Row>
      )}
      <SearchModal
        show={showSearchModal}
        searchWallets={searchWallets}
        setShow={function (show: boolean) {
          setShowSearchModal(show);
        }}
        addSearchWallet={function (newW: string) {
          setSearchWallets((searchWallets) => [...searchWallets, newW]);
        }}
        removeSearchWallet={function (removeW: string) {
          setSearchWallets([...searchWallets].filter((sw) => sw != removeW));
        }}
        clearSearchWallets={function () {
          setSearchWallets([]);
        }}
      />
    </Container>
  );
}
