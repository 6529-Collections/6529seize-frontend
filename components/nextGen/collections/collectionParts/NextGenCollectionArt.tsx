import styles from "../NextGen.module.scss";
import { Container, Row, Col, FormCheck, Accordion } from "react-bootstrap";
import NextGenTokenList from "../NextGenTokenList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextGenCollection, TraitValues } from "../../../../entities/INextgen";
import { useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useRouter } from "next/router";
import DotLoader from "../../../dotLoader/DotLoader";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean;
}

interface TraitValuePair {
  trait: string;
  value: string;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  const router = useRouter();
  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);
  const [routerLoaded, setRouterLoaded] = useState(false);
  const [selectedTraitValues, setSelectedTraitValues] = useState<
    TraitValuePair[]
  >([]);

  useEffect(() => {
    if (traitsLoaded) {
      if (router.query.traits) {
        const traitsQuery = router.query.traits as string;
        const traitValues = traitsQuery.split(",");
        const selectedTraits: TraitValuePair[] = [];
        traitValues.map((tv) => {
          const traitValue = tv.split(":");
          const t = traitValue[0];
          const v = traitValue[1];
          if (traits.some((tr) => tr.trait === t && tr.values.includes(v))) {
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
        const traitsQuery = selectedTraitValues
          .map((t) => `${t.trait}:${t.value}`)
          .join(",");
        router.push(
          `/nextgen/collection/${props.collection.id}/art?traits=${traitsQuery}`,
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

  function getDefaultActiveKeys() {
    const activeKeys: string[] = [];
    traits.map((t, index) => {
      if (
        selectedTraitValues.some((st) => st.trait === t.trait) ||
        selectedTraitValues.length === 0
      ) {
        activeKeys.push(index.toString());
      }
    });
    return activeKeys;
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center justify-content-between">
          <h3 className="mb-0">The Art</h3>
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
                <Col className="font-color-h font-bolder font-larger">
                  Traits
                </Col>
              </Row>
              <Row>
                <Col className="d-flex flex-column pt-2 pb-2 no-padding">
                  {routerLoaded && (
                    <Accordion
                      className={styles.traitsAccordion}
                      defaultActiveKey={getDefaultActiveKeys()}>
                      {traits.map((tr, index) => (
                        <Accordion.Item
                          key={`trait-${tr.trait.replaceAll(" ", "-")}`}
                          defaultChecked={true}
                          className={styles.traitsAccordionItem}
                          eventKey={index.toString()}>
                          <Accordion.Button className="d-flex">
                            <span>{tr.trait}</span>&nbsp;&nbsp;
                            <span className="font-color-h">
                              x{tr.values.length}
                            </span>
                          </Accordion.Button>
                          <Accordion.Body
                            className={styles.traitsAccordionBody}>
                            {tr.values.map((v) => (
                              <FormCheck
                                key={`trait-${v.replaceAll(" ", "-")}`}
                                type="checkbox"
                                label={v}
                                name="trait"
                                checked={selectedTraitValues.some(
                                  (t) =>
                                    t.trait === tr.trait &&
                                    t.value.toLowerCase() === v.toLowerCase()
                                )}
                                className="pt-1 pb-1"
                                onChange={() => {
                                  if (
                                    selectedTraitValues.some(
                                      (t) =>
                                        t.trait === tr.trait &&
                                        t.value.toLowerCase() ===
                                          v.toLowerCase()
                                    )
                                  ) {
                                    setSelectedTraitValues(
                                      selectedTraitValues.filter(
                                        (t) =>
                                          t.trait !== tr.trait &&
                                          t.value !== v.toLowerCase()
                                      )
                                    );
                                  } else {
                                    setSelectedTraitValues([
                                      ...selectedTraitValues,
                                      {
                                        trait: tr.trait,
                                        value: v.toLowerCase(),
                                      },
                                    ]);
                                  }
                                }}
                              />
                            ))}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  )}
                </Col>
              </Row>
            </Container>
          </Col>
        )}
        <Col sm={12} md={props.show_view_all ? 12 : 10}>
          <NextGenTokenList
            collection={props.collection}
            limit={props.show_view_all ? 9 : undefined}
            // selected_traits={selectedTraits}
          />
        </Col>
      </Row>
    </Container>
  );
}
