import styles from "../NextGen.module.scss";
import { Container, Row, Col, Accordion, Form } from "react-bootstrap";
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

  useEffect(() => {
    if (traitsLoaded && !routerLoaded) {
      if (router.query.traits) {
        const traitsQuery = router.query.traits as string;
        const traitValues = traitsQuery.split(",");
        const selectedTraits: TraitValuePair[] = [];
        traitValues.map((tv) => {
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
      setRouterLoaded(true);
    }
  }, [router.query.traits, traitsLoaded]);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response);
      setTraitsLoaded(true);
    });
  }, [props.collection.id]);

  useEffect(() => {
    if (!props.show_view_all && routerLoaded) {
      if (selectedTraitValues.length > 0) {
        const traitsQ = selectedTraitValues
          .map((t) => `${t.trait}:${t.value}`)
          .join(",");
        router.push(
          `/nextgen/collection/${props.collection.id}/art?traits=${traitsQ}`,
          undefined,
          { shallow: true }
        );
      } else {
        router.push(
          `/nextgen/collection/${props.collection.id}/art`,
          undefined,
          {
            shallow: true,
          }
        );
      }
    }
  }, [props.show_view_all, selectedTraitValues, routerLoaded]);

  useEffect(() => {
    if (totalResultsSet) {
      setTotalResultsSet(false);
    }
  }, [selectedTraitValues]);

  function getDefaultActiveKeys() {
    const activeKeys: string[] = [];
    traits.map((t, index) => {
      if (selectedTraitValues.some((st) => st.trait === t.trait)) {
        activeKeys.push(index.toString());
      }
    });
    return activeKeys;
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h3 className="mb-0">
            The Art{" "}
            {totalResultsSet ? (
              <span className="font-color-h font-smaller">
                (x{totalResults})
              </span>
            ) : (
              <DotLoader />
            )}
          </h3>
          {props.show_view_all && (
            <a
              href={`/nextgen/collection/${props.collection.id}/art`}
              className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}>
              <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                View All
                <FontAwesomeIcon
                  icon="arrow-circle-right"
                  className={styles.viewAllIcon}
                />
              </h5>
            </a>
          )}
        </Col>
      </Row>
      <hr />
      <Row>
        {!props.show_view_all && (
          <Col sm={12} md={2}>
            <Container>
              <Row>
                <Col
                  xs={12}
                  className="font-color-h font-bolder font-larger no-padding">
                  Traits
                </Col>
                {selectedTraitValues.length > 0 && (
                  <Col
                    xs={12}
                    className="no-padding d-flex justify-content-between align-items-center">
                    <span className="font-color-h font-smaller">
                      ({selectedTraitValues.length} selected)
                    </span>
                    <span
                      className="font-cmaller cursor-pointer decoration-hover-underline"
                      onClick={() => setSelectedTraitValues([])}>
                      Clear
                    </span>
                  </Col>
                )}
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
                          {tr.values.map((v) => (
                            <Accordion.Body
                              key={`trait-${v.replaceAll(" ", "-")}`}
                              className={styles.traitsAccordionBody}>
                              <Form.Check
                                type="checkbox"
                                label={v}
                                id={`trait-${v.replaceAll(" ", "-")}`}
                                checked={selectedTraitValues.some(
                                  (t) =>
                                    areEqualAddresses(t.trait, tr.trait) &&
                                    areEqualAddresses(t.value, v)
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
                                          areEqualAddresses(
                                            t.trait,
                                            tr.trait
                                          ) && areEqualAddresses(t.value, v)
                                      )
                                    );
                                  } else {
                                    setSelectedTraitValues([
                                      ...selectedTraitValues,
                                      {
                                        trait: tr.trait,
                                        value: v,
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
          <Col sm={12} md={props.show_view_all ? 12 : 10}>
            <NextGenTokenList
              limit={props.show_view_all ? 9 : undefined}
              collection={props.collection}
              selected_traits={selectedTraitValues}
              setTotalResults={(totalResults: number) => {
                setTotalResults(totalResults);
                setTotalResultsSet(true);
              }}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
}
