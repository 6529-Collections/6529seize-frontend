import styles from "../NextGen.module.scss";
import { useState, useEffect, Fragment } from "react";
import { Container, Row, Col, Accordion } from "react-bootstrap";
import { DBResponse } from "../../../../entities/IDBResponse";
import {
  NextGenCollection,
  NextgenTraitSet,
  TraitValues,
} from "../../../../entities/INextgen";
import { commonApiFetch } from "../../../../services/api/common-api";
import {
  capitalizeEveryWord,
  cicToType,
  formatAddress,
} from "../../../../helpers/Helpers";
import Pagination from "../../../pagination/Pagination";
import DotLoader from "../../../dotLoader/DotLoader";
import Image from "next/image";
import { NEXTGEN_MEDIA_BASE_URL } from "../../../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { normalizeNextgenTokenID } from "../../nextgen_helpers";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";

const PAGE_SIZE = 10;

const TRAITS: Record<number, string[]> = {
  1: ["Palette", "Size", "Traced"],
  2: ["Border", "Color"],
};

const ULTIMATE = "Ultimate";

export default function NextGenCollectorSets(
  props: Readonly<{
    collection: NextGenCollection;
  }>
) {
  const [page, setPage] = useState(1);

  const availableTraits: string[] = TRAITS[props.collection.id];

  const [selectedTrait, setSelectedTrait] = useState<string>(
    availableTraits[0]
  );

  const [selectedTraitValues, setSelectedTraitValues] = useState<string[]>([]);

  const [sets, setSets] = useState<NextgenTraitSet[]>([]);
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response.filter((t) => t.trait !== "Collection Name"));
      setTraitsLoaded(true);
    });
  }, [props.collection.id]);

  function fetchResults(mypage: number, mytrait: string) {
    setSetsLoaded(false);
    let path;
    if (selectedTrait === ULTIMATE) {
      path = `nextgen/collections/${
        props.collection.id
      }/ultimate_trait_set?trait=${availableTraits.join(
        ","
      )}&page_size=${PAGE_SIZE}&page=${mypage}`;
    } else {
      path = `nextgen/collections/${props.collection.id}/trait_sets/${mytrait}?&page_size=${PAGE_SIZE}&page=${mypage}`;
    }
    commonApiFetch<DBResponse>({
      endpoint: path,
    }).then((response) => {
      setTotalResults(response.count);
      setSets(response.data);
      setSetsLoaded(true);
    });
  }

  useEffect(() => {
    if (selectedTrait && traitsLoaded) {
      setSelectedTraitValues(
        traits.find((t) => t.trait === selectedTrait)?.values ?? []
      );
      if (page === 1) {
        fetchResults(page, selectedTrait);
      } else {
        setPage(1);
      }
    }
  }, [selectedTrait, traitsLoaded]);

  useEffect(() => {
    if (selectedTrait) {
      fetchResults(page, selectedTrait);
    }
  }, [page]);

  function printTraitPill(t: string) {
    return (
      <Col xs={12 / (availableTraits.length + 1)} className="no-padding">
        <button
          key={getRandomObjectId()}
          className={`${styles.collectorSetPill} ${
            t === selectedTrait ? styles.collectorSetPillSelected : ""
          }`}
          onClick={() => {
            if (selectedTrait === ULTIMATE || t === ULTIMATE) {
              setSets([]);
              setTotalResults(0);
            }
            setSelectedTrait(t);
          }}>
          {t}
        </button>
      </Col>
    );
  }

  function printUltimate() {
    let content;
    if (!setsLoaded) {
      content = (
        <Col>
          <DotLoader />
        </Col>
      );
    } else if (totalResults == 0) {
      content = <Col>None!</Col>;
    } else {
      content = sets.map((s) => (
        <Col xs={12} key={getRandomObjectId()}>
          <UltimateOwner set={s} />
        </Col>
      ));
    }
    return <Row className="pt-3">{content}</Row>;
  }

  return (
    <Container className="no-padding pt-2">
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Collector</span> Sets
          </h1>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <Container>
            <Row>
              {availableTraits.map((trait) => printTraitPill(trait))}
              {printTraitPill(ULTIMATE)}
            </Row>
          </Container>
        </Col>
      </Row>
      {selectedTrait !== ULTIMATE && (
        <Row className="pt-4">
          <Col className="d-flex align-items-center justify-content-between">
            <span>
              {!setsLoaded ? (
                <DotLoader />
              ) : (
                <>
                  Unique values for <b>{selectedTrait}</b> trait: x
                  {selectedTraitValues.length.toLocaleString()}
                </>
              )}
            </span>
            <span>Collectors Count: {totalResults.toLocaleString()}</span>
          </Col>
        </Row>
      )}
      {selectedTrait === ULTIMATE && (
        <Row className="pt-4">
          <Col xs={12} className="font-larger font-bolder">
            <u>{ULTIMATE} Set</u>
          </Col>
          <Col xs={12}>{`All ${availableTraits.join(", All ")} Types`}</Col>
        </Row>
      )}
      {selectedTrait !== ULTIMATE && (
        <Row className="pt-3">
          <Col>
            {sets.map((s) => (
              <TraitSetAccordion
                key={`collector-sets-${s.owner}`}
                collection={props.collection}
                trait={selectedTrait}
                set={s}
                values={selectedTraitValues}
              />
            ))}
          </Col>
        </Row>
      )}
      {selectedTrait === ULTIMATE && printUltimate()}
      {totalResults > 0 && totalResults / PAGE_SIZE > 1 && (
        <Row className="text-center pt-2 pb-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalResults={totalResults}
            setPage={function (newPage: number) {
              setPage(newPage);
            }}
          />
        </Row>
      )}
    </Container>
  );
}

function UltimateOwner(props: Readonly<{ set: NextgenTraitSet }>) {
  const set = props.set;
  const keys = Object.entries(set)
    .filter(([key]) => key.endsWith("_sets"))
    .map(([key, value]) => {
      return {
        key: capitalizeEveryWord(key.replace("_sets", "")),
        count: value,
      };
    });

  return (
    <Accordion className="pt-1 pb-1">
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button
          className={styles.collectorSetAccordionButtonUltimate}>
          <Container>
            <Row>
              <Col className="d-flex aling-items-center justify-content-between">
                <span>
                  <Owner set={set} />
                </span>
                <span className="d-flex gap-3">
                  {keys.map((k) => (
                    <span key={getRandomObjectId()}>
                      <b>{k.key}</b> Sets: {k.count}
                    </span>
                  ))}
                </span>
              </Col>
            </Row>
          </Container>
        </Accordion.Button>
      </Accordion.Item>
    </Accordion>
  );
}

function Owner(props: Readonly<{ set: NextgenTraitSet }>) {
  function getOwnerDisplay() {
    if (props.set.normalised_handle) {
      return props.set.normalised_handle;
    }
    if (
      props.set.consolidation_display?.includes("-") ||
      props.set.consolidation_display?.includes(".eth")
    ) {
      return props.set.consolidation_display;
    }

    return formatAddress(props.set.owner);
  }

  return (
    <a
      className="d-flex gap-2 decoration-hover-underline"
      onClick={(e) => e.stopPropagation()}
      href={`/${props.set.handle ?? props.set.owner}`}>
      <UserCICAndLevel
        level={props.set.level}
        cicType={cicToType(props.set.tdh + props.set.rep_score)}
      />{" "}
      {getOwnerDisplay()}
    </a>
  );
}
function TraitSetAccordion(
  props: Readonly<{
    collection: NextGenCollection;
    trait: string;
    set: NextgenTraitSet;
    values: string[];
  }>
) {
  const set = props.set;

  const missingValues = props.values.filter(
    (v) => !set.token_values?.map((tv) => tv.value).includes(v)
  );

  return (
    <Accordion className="pt-1 pb-1">
      <Accordion.Item defaultChecked={true} eventKey={"0"}>
        <Accordion.Button className="d-flex justify-content-between">
          <Container>
            <Row>
              <Col className="d-flex aling-items-center gap-3">
                <span>
                  <b>{set.distinct_values_count}</b>
                </span>
                <span>-</span>
                <span>
                  <Owner set={set} />
                </span>
                {missingValues.length === 0 && (
                  <Tippy
                    theme="light"
                    delay={250}
                    content={
                      <>
                        Complete <b>{props.trait}</b> trait set!
                      </>
                    }>
                    <FontAwesomeIcon
                      style={{ height: "1.5em", color: "#00aa00" }}
                      icon="check-circle"></FontAwesomeIcon>
                  </Tippy>
                )}
              </Col>
            </Row>
          </Container>
        </Accordion.Button>
        <Accordion.Body className={styles.collectorSetAccordionBody}>
          <Container>
            {props.set.token_values?.map((tv) => (
              <Row
                className="pt-3 pb-3"
                key={`accordion-${props.trait}-${tv.value}`}>
                <Col className="d-flex flex-wrap align-items-center gap-3">
                  <span className="d-flex align-items-center gap-3">
                    <FontAwesomeIcon
                      style={{ height: "1.5em", color: "#00aa00" }}
                      icon="check-circle"></FontAwesomeIcon>
                    <b>
                      <a
                        href={`/nextgen/collection/${props.collection.name}/art?traits=${props.trait}:${tv.value}`}
                        className="decoration-hover-underline"
                        target="_blank"
                        rel="noreferrer">
                        {tv.value}
                      </a>
                    </b>
                  </span>
                  <span className="d-flex flex-wrap">
                    {tv.tokens.map((t) => (
                      <a
                        key={`accordion-${props.trait}-${tv.value}-${t}`}
                        href={`/nextgen/token/${t}`}
                        target="_blank"
                        rel="noreferrer">
                        <Tippy
                          theme="light"
                          delay={250}
                          content={`${props.collection.name} #${
                            normalizeNextgenTokenID(t).token_id
                          }`}>
                          <Image
                            priority
                            loading="eager"
                            width={0}
                            height={0}
                            style={{
                              height: "50px",
                              width: "auto",
                              marginLeft: "5px",
                              marginRight: "5px",
                            }}
                            src={`${NEXTGEN_MEDIA_BASE_URL}/png/${t}`}
                            alt={`#${t.toString()}`}
                          />
                        </Tippy>
                      </a>
                    ))}
                  </span>
                </Col>
              </Row>
            ))}
            <Row className="pt-4">
              <Col>
                {missingValues.length > 0 ? (
                  <>
                    Missing Values:{" "}
                    {missingValues.map((mv, index) => (
                      <Fragment key={mv}>
                        <a
                          href={`/nextgen/collection/${props.collection.name}/art?traits=${props.trait}:${mv}`}
                          className="decoration-hover-underline"
                          target="_blank"
                          rel="noreferrer">
                          {mv}
                        </a>
                        {index < missingValues.length - 1 ? ", " : ""}
                      </Fragment>
                    ))}
                  </>
                ) : (
                  <>
                    All values for <b>{props.trait}</b> trait Seized!
                  </>
                )}
              </Col>
            </Row>
          </Container>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
