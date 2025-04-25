import styles from "./NextGen.module.scss";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import NextGenCollectionPreview from "./NextGenCollectionPreview";
import { useState, useEffect } from "react";
import { DBResponse } from "../../../entities/IDBResponse";
import { fetchUrl } from "../../../services/6529api";
import { NextGenCollection } from "../../../entities/INextgen";
import Pagination from "../../pagination/Pagination";
import CollectionsDropdown from "../../collections-dropdown/CollectionsDropdown";

const PAGE_SIZE = 25;

enum StatusFilter {
  ALL = "ALL",
  LIVE = "LIVE",
  UPCOMING = "UPCOMING",
  COMPLETED = "COMPLETED",
}

export default function NextGenCollections() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(
    StatusFilter.ALL
  );

  const [collections, setCollections] = useState<NextGenCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);

  function fetchResults(mypage: number) {
    setCollectionsLoaded(false);
    let statusFilter = "";
    if (selectedStatus !== StatusFilter.ALL) {
      statusFilter = `&status=${selectedStatus}`;
    }

    let url = `${process.env.API_ENDPOINT}/api/nextgen/collections?page_size=${PAGE_SIZE}&page=${mypage}${statusFilter}`;
    fetchUrl(url).then((response: DBResponse) => {
      setTotalResults(response.count);
      setCollections(response.data);
      setCollectionsLoaded(true);
    });
  }

  useEffect(() => {
    if (page === 1) {
      fetchResults(page);
    } else {
      setPage(1);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchResults(page);
  }, [page]);

  return (
    <Container className="no-padding pt-4 pb-4">
      {/* Desktop header */}
      <Row className="pb-3 d-none d-md-flex">
        <Col className="d-flex justify-content-between">
          <h1>Collections</h1>
          <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
            <Dropdown.Toggle>Status: {selectedStatus}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(StatusFilter).map((filter) => (
                <Dropdown.Item
                  key={`filter-${filter}`}
                  onClick={() => setSelectedStatus(filter)}>
                  {filter}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Mobile header with collections dropdown */}
      <Row className="d-flex d-md-none">
        <Col xs={12} className="d-flex align-items-center justify-content-between mb-3">
          <h1 className="mb-0">Collections</h1>
        </Col>
        <Col xs={12} className="mb-3">
          <CollectionsDropdown activePage="nextgen" />
        </Col>
        <Col xs={12} className="mb-3">
          <Dropdown className={`${styles.filterDropdown} w-100`}>
            <Dropdown.Toggle className="w-100">Status: {selectedStatus}</Dropdown.Toggle>
            <Dropdown.Menu className="w-100">
              {Object.values(StatusFilter).map((filter) => (
                <Dropdown.Item
                  key={`filter-${filter}`}
                  onClick={() => setSelectedStatus(filter)}>
                  {filter}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Row className="pt-4 pb-4">
        {collections.map((collection) => (
          <Col
            className="pb-3"
            xs={12}
            sm={12}
            md={6}
            lg={4}
            key={`collection-preview-${collection.id}`}>
            <NextGenCollectionPreview
              collection={collection}
              key={`gen-memes-collection-${collection.id}`}
            />
          </Col>
        ))}
        {collectionsLoaded && collections.length === 0 && (
          <Col className="text-center">
            <h4>No collections found</h4>
          </Col>
        )}
      </Row>
      {totalResults > PAGE_SIZE && collectionsLoaded && (
        <Row className="text-center pt-4 pb-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
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
