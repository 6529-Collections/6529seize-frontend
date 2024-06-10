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
import { areEqualAddresses } from "../../../../../helpers/Helpers";
import Pagination from "../../../../pagination/Pagination";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../../../../searchModal/SearchModal";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import dynamic from "next/dynamic";

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
      returnSpots =
        addressEntries[index].spots - addressEntries[index - 1].spots;
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
      <Col
        xs={12}
        sm={6}
        md={4}
        key={getRandomObjectId()}
        className="pt-2 pb-2 d-flex flex-column">
        <Container className={styles.phaseBox}>
          <Row>
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
                      <span>{printPhaseDateTime(startTime)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="d-flex justify-content-center gap-3">
                      <span>
                        <b>End</b>
                      </span>
                      <span>{printPhaseDateTime(endTime)}</span>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Container>
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
        {phases.map((phase) =>
          printPhase(phase.phase, phase.start_time, phase.end_time)
        )}
        {phasesSet &&
          printPhase(
            "Public Phase",
            props.collection.public_start,
            props.collection.public_end
          )}
      </Row>
      {props.collection.distribution_plan && (
        <Row className="pt-3">
          <Col>
            <PdfViewer file={props.collection.distribution_plan} />
          </Col>
        </Row>
      )}
      <Row className="pt-4" ref={allowlistScrollTarget}>
        <Col className="d-flex align-items-center justify-content-between">
          <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
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
          <SearchWalletsDisplay
            searchWallets={searchWallets}
            setSearchWallets={setSearchWallets}
            setShowSearchModal={setShowSearchModal}
          />
        </Col>
      </Row>
      <Row className="table-scroll-container">
        <Col>
          <Table className={styles.logsTable}>
            <thead>
              <tr>
                <th>Address x{totalResults.toLocaleString()}</th>
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
                      href={`/${al.address}`}
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
      <SearchModalDisplay
        show={showSearchModal}
        setShow={setShowSearchModal}
        searchWallets={searchWallets}
        setSearchWallets={setSearchWallets}
      />
    </Container>
  );
}
