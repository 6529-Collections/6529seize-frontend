import styles from "./NextGen.module.scss";
import { Container, Row, Col, Dropdown } from "react-bootstrap";
import { useEffect, useState } from "react";
import NextGenCollectionPreview from "./NextGenCollectionPreview";
import { useCollectionIndex } from "../nextgen_helpers";
import Image from "next/image";
import { PhaseTimes, Status } from "../nextgen_entities";

enum TypeFilter {
  ALL = "ALL",
  LIVE = "LIVE",
  AL_UPCOMING = "ALLOWLIST UPCOMING",
  PUBLIC_UPCOMING = "PUBLIC PHASE UPCOMING",
  COMPLETE = "COMPLETE",
}

export function Spinner() {
  return (
    <div className="d-inline">
      <output className={`spinner-border ${styles.loader}`}>
        <span className="sr-only">Loading...</span>
      </output>
    </div>
  );
}

export default function NextGen() {
  const collectionIndexRead = useCollectionIndex();
  const collectionIndex = collectionIndexRead.data
    ? parseInt(collectionIndexRead?.data as string) - 1
    : 0;

  const [typeFilter, setTypeFilter] = useState<TypeFilter>();

  const [collections, setCollections] = useState<
    { id: number; phaseTimes?: PhaseTimes }[]
  >([]);

  const [collectionsLoaded, setCollectionsLoaded] = useState(false);

  const [filteredCollections, setFilteredCollections] = useState<
    { id: number; phaseTimes?: PhaseTimes }[]
  >([]);

  useEffect(() => {
    const newCollections = [];
    for (let i = 0; i < collectionIndex; i++) {
      newCollections.push({ id: i + 1 });
    }
    setCollections(newCollections);
    setCollectionsLoaded(true);
  }, [collectionIndex]);

  useEffect(() => {
    if (!typeFilter) {
      setFilteredCollections(collections);
    } else {
      switch (typeFilter) {
        case TypeFilter.ALL:
          setFilteredCollections(collections);
          break;
        case TypeFilter.LIVE:
          setFilteredCollections(
            collections.filter(
              (c) =>
                c.phaseTimes?.al_status === Status.LIVE ||
                c.phaseTimes?.public_status === Status.LIVE
            )
          );
          break;
        case TypeFilter.AL_UPCOMING:
          setFilteredCollections(
            collections.filter(
              (c) => c.phaseTimes?.al_status === Status.UPCOMING
            )
          );
          break;
        case TypeFilter.PUBLIC_UPCOMING:
          setFilteredCollections(
            collections.filter(
              (c) => c.phaseTimes?.public_status === Status.UPCOMING
            )
          );
          break;
        case TypeFilter.COMPLETE:
          setFilteredCollections(
            collections.filter(
              (c) => c.phaseTimes?.public_status === Status.COMPLETE
            )
          );
          break;
      }
    }
  }, [typeFilter, collections]);

  return (
    <Container>
      <Row className="d-flex align-items-center pt-4">
        <Col
          xs={12}
          className="pt-3 pb-3 d-flex align-items-center justify-content-between">
          <Image
            priority
            width="0"
            height="0"
            style={{ width: "400px", maxWidth: "85vw", height: "auto" }}
            src="/nextgen-logo.png"
            alt="nextgen"
          />
          <Dropdown className={styles.filterDropdown} drop={"down-centered"}>
            <Dropdown.Toggle>Status: {typeFilter ?? "ALL"}</Dropdown.Toggle>
            <Dropdown.Menu>
              {Object.values(TypeFilter).map((filter) => (
                <Dropdown.Item
                  key={`filter-${filter}`}
                  onClick={() => setTypeFilter(filter)}>
                  {filter}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
      <Row className="pt-4 pb-4">
        {filteredCollections.map((collection) => (
          <Col
            className="pb-3"
            xs={12}
            sm={12}
            md={6}
            lg={4}
            key={`collection-preview-${collection.id}`}>
            <NextGenCollectionPreview
              collection={collection.id}
              setPhaseTimes={(phaseTimes) => {
                setCollections((collections) =>
                  collections.map((c) =>
                    c.id === collection.id
                      ? { ...c, phaseTimes: phaseTimes }
                      : c
                  )
                );
              }}
              key={`gen-memes-collection-${collection.id}`}
            />
          </Col>
        ))}
        {collectionsLoaded && filteredCollections.length === 0 && (
          <Col className="text-center">
            <h4>No collections found</h4>
          </Col>
        )}
      </Row>
    </Container>
  );
}
