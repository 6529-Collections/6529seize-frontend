import styles from "../NextGen.module.scss";
import {
  Container,
  Row,
  Col,
  Accordion,
  Form,
  Dropdown,
} from "react-bootstrap";
import NextGenTokenList from "../NextGenTokenList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  NextGenCollection,
  TraitValuePair,
  TraitValues,
} from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useRouter } from "next/router";
import DotLoader from "../../../dotLoader/DotLoader";
import { areEqualAddresses } from "../../../../helpers/Helpers";
import { SortDirection } from "../../../../entities/ISort";
import { NextGenListFilters, formatNameForUrl } from "../../nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  const router = useRouter();
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

  function setTraitsQuery(q: string) {
    if (q) {
      const traitsQuery = router.query.traits as string;
      const traitValues = traitsQuery.split(",");
      const selectedTraits: TraitValuePair[] = [];
      traitValues.forEach((tv) => {
        const traitValue = tv.split(":");
        const t = traitValue[0];
        const v = traitValue[1];
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
      setTraitsQuery(router.query.traits as string);
      if (router.query.sort) {
        const sortQuery = router.query.sort as string;
        setSort(
          NextGenListFilters[
            sortQuery?.toUpperCase() as keyof typeof NextGenListFilters
          ] || NextGenListFilters.ID
        );
      }
      if (router.query.sort_direction) {
        const sortDirQuery = router.query.sort_direction as string;
        setSortDir(
          SortDirection[
            sortDirQuery?.toUpperCase() as keyof typeof SortDirection
          ] || SortDirection.DESC
        );
      }
      setRouterLoaded(true);
    }
  }, [router.query.traits, traitsLoaded]);

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
      router.push(
        `/nextgen/collection/${formatNameForUrl(props.collection.name)}/art${
          query ? `?${query}` : ""
        }`,
        undefined,
        { shallow: true }
      );
    }
  }, [routerLoaded, selectedTraitValues, sort, sortDir]);

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
    <Container className="no-padding pt-4">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
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
          {props.show_view_all ? (
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/art`}
              className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}>
              <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                View All
                <FontAwesomeIcon
                  icon="arrow-circle-right"
                  className={styles.viewAllIcon}
                />
              </h5>
            </a>
          ) : (
            <span className="d-flex gap-2 align-items-center">
              <Dropdown className={styles.rarityDropdown}>
                <Dropdown.Toggle>Sort: {sort}</Dropdown.Toggle>
                <Dropdown.Menu>
                  {Object.values(NextGenListFilters).map((lf) => (
                    <Dropdown.Item
                      key={`sort-${lf}`}
                      onClick={() => setSort(lf)}>
                      {lf}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
              <FontAwesomeIcon
                icon="chevron-circle-up"
                style={{
                  cursor: "pointer",
                  height: "22px",
                  color: sortDir === SortDirection.ASC ? "white" : "#9a9a9a",
                }}
                onClick={() => setSortDir(SortDirection.ASC)}
              />
              <FontAwesomeIcon
                icon="chevron-circle-down"
                style={{
                  cursor: "pointer",
                  height: "22px",
                  color: sortDir === SortDirection.DESC ? "white" : "#9a9a9a",
                }}
                onClick={() => setSortDir(SortDirection.DESC)}
              />
            </span>
          )}
        </Col>
      </Row>
      <hr />
      <Row>
        {!props.show_view_all && (
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
                <Col className="d-flex flex-column pt-2 pb-2 no-padding">
                  {routerLoaded &&
                    traits.map((tr, index) => (
                      <Accordion
                        key={`trait-${tr.trait.replaceAll(" ", "-")}`}
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
                              key={`trait-${v.key.replaceAll(" ", "-")}`}
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
                                        areEqualAddresses(t.value, v)
                                    )
                                  ) {
                                    setSelectedTraitValues(
                                      selectedTraitValues.filter(
                                        (t) =>
                                          !(
                                            areEqualAddresses(
                                              t.trait,
                                              tr.trait
                                            ) && areEqualAddresses(t.value, v)
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
          <Col sm={12} md={props.show_view_all ? 12 : 9}>
            <NextGenTokenList
              limit={props.show_view_all ? 6 : undefined}
              collection={props.collection}
              sort={props.show_view_all ? undefined : sort}
              sort_direction={props.show_view_all ? undefined : sortDir}
              selected_traits={selectedTraitValues}
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
