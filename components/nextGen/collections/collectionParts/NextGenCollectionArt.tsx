"use client";

import {
  faArrowCircleRight,
  faChevronCircleDown,
  faChevronCircleUp,
  faFilter,
  faFilterCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  Accordion,
  Col,
  Container,
  Dropdown,
  Form,
  Row,
} from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import {
  NextGenCollection,
  TraitValuePair,
  TraitValues,
} from "@/entities/INextgen";
import { SortDirection } from "@/entities/ISort";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  NextGenListFilters,
  NextGenTokenListedType,
  formatNameForUrl,
} from "@/components/nextGen/nextgen_helpers";
import styles from "../NextGen.module.scss";
import { NextgenRarityToggle } from "../nextgenToken/NextGenTokenProperties";
import NextGenTokenList from "../NextGenTokenList";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const screenSize = window.innerWidth;
    if (screenSize <= 750) {
      setShowFilters(false);
      setIsMobile(true);
    } else {
      setShowFilters(true);
      setIsMobile(false);
    }
  }, []);

  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);
  const [routerLoaded, setRouterLoaded] = useState(false);
  const [selectedTraitValues, setSelectedTraitValues] = useState<
    TraitValuePair[]
  >([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalResultsSet, setTotalResultsSet] = useState(false);
  const [sortDir, setSortDir] = useState(
    props.show_view_all ? SortDirection.ASC : SortDirection.DESC
  );
  const [sort, setSort] = useState(NextGenListFilters.ID);

  const [showNormalised, setShowNormalised] = useState(true);
  const [showTraitCount, setShowTraitCount] = useState(true);

  const [showFilters, setShowFilters] = useState(true);

  const [listedType, setListedType] = useState(NextGenTokenListedType.ALL);

  function isRaritySort(s: NextGenListFilters) {
    return [
      NextGenListFilters.RARITY_SCORE,
      NextGenListFilters.STATISTICAL_SCORE,
      NextGenListFilters.SINGLE_TRAIT_RARITY,
    ].includes(s);
  }

  function setTraitsQuery(q: string) {
    if (q) {
      const traitValues = q.split(",");
      const selectedTraits: TraitValuePair[] = [];
      traitValues.forEach((tv) => {
        const [t, v] = tv.split(":");
        if (
          traits.some(
            (tr) =>
              areEqualAddresses(tr.trait, t) &&
              tr.values.some((vl) => areEqualAddresses(vl, v))
          )
        ) {
          selectedTraits.push({
            trait: t,
            value: v,
          });
        }
      });
      setSelectedTraitValues(selectedTraits);
    } else {
      setSelectedTraitValues([]);
    }
  }

  useEffect(() => {
    if (traitsLoaded && !routerLoaded) {
      setTraitsQuery(searchParams?.get("traits") ?? "");
      const sortParam = searchParams?.get("sort");
      if (sortParam) {
        const sortQuery = sortParam as string;
        const newSort =
          NextGenListFilters[
            sortQuery?.toUpperCase() as keyof typeof NextGenListFilters
          ] || NextGenListFilters.ID;
        setSort(newSort);
        if (isRaritySort(newSort)) {
          const showNorm = searchParams?.get("show_normalised");
          if (showNorm) {
            setShowNormalised(showNorm === "true");
          }
          const showCount = searchParams?.get("show_trait_count");
          if (showCount) {
            setShowTraitCount(showCount === "true");
          }
        }
      }
      const sortDirParam = searchParams?.get("sort_direction");
      if (sortDirParam) {
        const sortDirQuery = sortDirParam as string;
        setSortDir(
          SortDirection[
            sortDirQuery?.toUpperCase() as keyof typeof SortDirection
          ] || SortDirection.DESC
        );
      }
      const listedParam = searchParams?.get("listed");
      if (listedParam) {
        const listedQuery = listedParam as string;
        setListedType(
          listedQuery === "true"
            ? NextGenTokenListedType.LISTED
            : NextGenTokenListedType.NOT_LISTED
        );
      }
      setRouterLoaded(true);
    }
  }, [searchParams, traitsLoaded, routerLoaded]);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response.filter((t) => t.trait !== "Collection Name"));
      setTraitsLoaded(true);
    });
  }, [props.collection.id]);

  useEffect(() => {
    if (!props.show_view_all && routerLoaded) {
      let query = "";
      if (selectedTraitValues.length > 0) {
        const traitsQ = selectedTraitValues
          .map((t) => `${t.trait}:${t.value}`)
          .join(",");
        query += `traits=${encodeURIComponent(traitsQ)}`;
      }
      if (sort) {
        query += `&sort=${sort.replaceAll(" ", "_").toLowerCase()}`;
      }
      if (sortDir) {
        query += `&sort_direction=${sortDir.toLowerCase()}`;
      }
      if (isRaritySort(sort)) {
        if (!showNormalised) {
          query += `&show_normalised=false`;
        }
        if (!showTraitCount) {
          query += `&show_trait_count=false`;
        }
      }
      if (listedType !== NextGenTokenListedType.ALL) {
        query += `&listed=${listedType === NextGenTokenListedType.LISTED}`;
      }
      router.push(
        `/nextgen/collection/${formatNameForUrl(props.collection.name)}/art${
          query ? `?${query}` : ""
        }`
      );
    }
  }, [
    routerLoaded,
    selectedTraitValues,
    sort,
    sortDir,
    showNormalised,
    showTraitCount,
    listedType,
  ]);

  useEffect(() => {
    if (totalResultsSet) {
      setTotalResultsSet(false);
    }
  }, [selectedTraitValues]);

  function getDefaultActiveKeys() {
    const activeKeys: string[] = [];
    traits.forEach((t, index) => {
      if (selectedTraitValues.some((st) => st.trait === t.trait)) {
        activeKeys.push(index.toString());
      }
    });
    return activeKeys;
  }

  return (
    <Container className="no-padding pt-2">
      <Row>
        <Col className="d-flex align-items-center justify-content-between no-wrap">
          <h3 className="mb-0">
            The Art{" "}
            {totalResultsSet ? (
              <span className="font-color-h font-smaller">
                (x{totalResults.toLocaleString()})
              </span>
            ) : (
              <DotLoader />
            )}
          </h3>
        </Col>
        <Col
          className={`d-flex align-items-center ${
            isMobile ? "pt-3 justify-content-between" : "justify-content-end"
          }`}>
          {props.show_view_all ? (
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/art`}
              className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}>
              <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                View All
                <FontAwesomeIcon
                  icon={faArrowCircleRight}
                  className={styles.viewAllIcon}
                />
              </h5>
            </Link>
          ) : (
            <>
              <FontAwesomeIcon
                icon={showFilters ? faFilterCircleXmark : faFilter}
                style={{
                  cursor: "pointer",
                  height: "22px",
                  color: selectedTraitValues.length > 0 ? "#00dd00" : "white",
                }}
                onClick={() => setShowFilters(!showFilters)}
                data-tooltip-id={`nextgen-collection-art-filters-${props.collection.id}`}
              />
              <Tooltip
                id={`nextgen-collection-art-filters-${props.collection.id}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
                place="bottom"
                delayShow={250}>
                {`${showFilters ? "Hide" : "Show"} Filters${
                  selectedTraitValues.length > 0
                    ? ` (${selectedTraitValues.length} selected)`
                    : ""
                }`}
              </Tooltip>
              <Dropdown className={styles.rarityDropdown} drop="down-centered">
                <Dropdown.Toggle>Listing Status: {listedType}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.values(NextGenTokenListedType).map((lt) => (
                    <Dropdown.Item
                      key={getRandomObjectId()}
                      onClick={() => setListedType(lt)}>
                      {lt}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown className={styles.rarityDropdown} drop="down-centered">
                <Dropdown.Toggle>Sort: {sort}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.values(NextGenListFilters).map((lf) => (
                    <Fragment key={getRandomObjectId()}>
                      <Dropdown.Item
                        key={getRandomObjectId()}
                        onClick={() => setSort(lf)}>
                        {lf}
                      </Dropdown.Item>
                      {(lf === NextGenListFilters.ID ||
                        lf === NextGenListFilters.HIGHEST_SALE) && (
                        <Dropdown.Divider />
                      )}
                    </Fragment>
                  ))}
                  <Dropdown.Item
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isRaritySort(sort)) {
                        setShowNormalised(!showNormalised);
                      }
                    }}
                    className="px-2 d-flex align-items-center gap-2">
                    <NextgenRarityToggle
                      disabled={!isRaritySort(sort)}
                      title={"Trait Normalization"}
                      show={showNormalised}
                    />
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isRaritySort(sort)) {
                        setShowTraitCount(!showTraitCount);
                      }
                    }}
                    className="px-2 d-flex align-items-center gap-2">
                    <NextgenRarityToggle
                      title={"Trait Count"}
                      show={showTraitCount}
                      disabled={!isRaritySort(sort)}
                    />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <span
                className="d-flex align-items-center gap-2"
                style={{
                  paddingLeft: "15px",
                }}>
                <FontAwesomeIcon
                  icon={faChevronCircleUp}
                  style={{
                    cursor: "pointer",
                    height: "22px",
                    color: sortDir === SortDirection.ASC ? "white" : "#9a9a9a",
                  }}
                  onClick={() => setSortDir(SortDirection.ASC)}
                />
                <FontAwesomeIcon
                  icon={faChevronCircleDown}
                  style={{
                    cursor: "pointer",
                    height: "22px",
                    color: sortDir === SortDirection.DESC ? "white" : "#9a9a9a",
                  }}
                  onClick={() => setSortDir(SortDirection.DESC)}
                />
              </span>
            </>
          )}
        </Col>
      </Row>
      <hr />
      <Row>
        {!props.show_view_all && showFilters && (
          <Col sm={12} md={3}>
            <Container>
              <Row>
                <Col
                  xs={12}
                  className="no-padding d-flex justify-content-between align-items-center">
                  <span className="d-flex flex-column">
                    <span className="font-color-h font-bolder font-larger">
                      Traits
                    </span>
                    {selectedTraitValues.length > 0 && (
                      <span className="font-color-h font-smaller">
                        ({selectedTraitValues.length} selected)
                      </span>
                    )}
                  </span>
                  {selectedTraitValues.length > 0 && (
                    <button
                      className="btn-link font-cmaller cursor-pointer decoration-hover-underline"
                      onClick={() => setSelectedTraitValues([])}>
                      Clear
                    </button>
                  )}
                </Col>
              </Row>
              <Row>
                <Col className="d-flex flex-column pt-2 no-padding">
                  {routerLoaded &&
                    traits.map((tr, index) => (
                      <Accordion
                        key={getRandomObjectId()}
                        className={styles.traitsAccordion}
                        defaultActiveKey={getDefaultActiveKeys()}>
                        <Accordion.Item
                          defaultChecked={true}
                          className={styles.traitsAccordionItem}
                          eventKey={index.toString()}>
                          <Accordion.Button className="d-flex">
                            <span>{tr.trait}</span>&nbsp;&nbsp;
                            <span className="font-color-h">
                              x{tr.values.length}
                            </span>
                          </Accordion.Button>
                          {tr.value_counts.map((v) => (
                            <Accordion.Body
                              key={getRandomObjectId()}
                              className={styles.traitsAccordionBody}>
                              <Form.Check
                                type="checkbox"
                                label={
                                  <>
                                    {v.key}{" "}
                                    <span className="font-color-h">
                                      x{v.count}
                                    </span>
                                  </>
                                }
                                id={`trait-${v.key.replaceAll(" ", "-")}`}
                                checked={selectedTraitValues.some(
                                  (t) =>
                                    areEqualAddresses(t.trait, tr.trait) &&
                                    areEqualAddresses(t.value, v.key)
                                )}
                                className="pt-1 pb-1"
                                onChange={() => {
                                  if (
                                    selectedTraitValues.some(
                                      (t) =>
                                        areEqualAddresses(t.trait, tr.trait) &&
                                        areEqualAddresses(t.value, v.key)
                                    )
                                  ) {
                                    setSelectedTraitValues(
                                      selectedTraitValues.filter(
                                        (t) =>
                                          !(
                                            areEqualAddresses(
                                              t.trait,
                                              tr.trait
                                            ) &&
                                            areEqualAddresses(t.value, v.key)
                                          )
                                      )
                                    );
                                  } else {
                                    setSelectedTraitValues([
                                      ...selectedTraitValues,
                                      {
                                        trait: tr.trait,
                                        value: v.key,
                                      },
                                    ]);
                                  }
                                }}
                              />
                            </Accordion.Body>
                          ))}
                        </Accordion.Item>
                      </Accordion>
                    ))}
                </Col>
              </Row>
            </Container>
          </Col>
        )}
        {(routerLoaded || totalResultsSet) && (
          <Col sm={12} md={props.show_view_all || !showFilters ? 12 : 9}>
            <NextGenTokenList
              limit={props.show_view_all ? 6 : undefined}
              collection={props.collection}
              sort={props.show_view_all ? undefined : sort}
              sort_direction={props.show_view_all ? undefined : sortDir}
              selected_traits={selectedTraitValues}
              show_normalised={showNormalised}
              show_trait_count={showTraitCount}
              listed_type={listedType}
              setTotalResults={(totalResults: number) => {
                setTotalResults(totalResults);
                setTotalResultsSet(true);
              }}
              show_pagination={!props.show_view_all}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
}
