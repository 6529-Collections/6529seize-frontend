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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  formatNameForUrl,
  normalizeNextgenTokenID,
} from "../../nextgen_helpers";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";
import NextGenCollectionHeader from "./NextGenCollectionHeader";
import {
  SearchModalDisplay,
  SearchWalletsDisplay,
} from "../../../searchModal/SearchModal";
import {
  getNextGenIconUrl,
  getNextGenImageUrl,
} from "../nextgenToken/NextGenTokenImage";

const TRAITS: Record<number, string[]> = {
  1: ["Palette", "Size", "Traced"],
  2: ["Border", "Color"],
};

const ULTIMATE = "Ultimate";

export default function NextGenTraitSets(
  props: Readonly<{
    collection: NextGenCollection;
    preview?: boolean;
  }>
) {
  const [page, setPage] = useState(1);

  const PAGE_SIZE = props.preview ? 10 : 25;

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

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchWallets, setSearchWallets] = useState<string[]>([]);

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
      let filters = "";
      if (searchWallets.length > 0) {
        filters += `&search=${searchWallets.join(",")}`;
      }
      path = `nextgen/collections/${props.collection.id}/trait_sets/${mytrait}?&page_size=${PAGE_SIZE}&page=${mypage}${filters}`;
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
  }, [selectedTrait, traitsLoaded, searchWallets]);

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
        <Col
          style={{
            minHeight: "50vh",
          }}>
          <DotLoader />
        </Col>
      );
    } else if (totalResults == 0) {
      content = (
        <Col
          className="d-flex flex-column gap-2"
          style={{
            minHeight: "50vh",
          }}>
          <span>None!</span>
          <span>
            <Image
              priority
              loading="eager"
              width={0}
              height={0}
              style={{
                height: "60vh",
                width: "auto",
              }}
              src="/nextgen/none-ultimate.jpeg"
              alt="None Balloon"
            />
          </span>
        </Col>
      );
    } else {
      content = (
        <Col
          style={{
            minHeight: "50vh",
          }}>
          {sets.map((s) => (
            <UltimateOwner key={getRandomObjectId()} set={s} />
          ))}
        </Col>
      );
    }
    return <Row className="pt-3">{content}</Row>;
  }

  return (
    <Container className="no-padding pt-2 pb-5">
      {!props.preview && (
        <Row className="pb-4">
          <Col>
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col className="d-flex align-items-center justify-content-between gap-3">
          <h1 className="no-wrap">
            <span className="font-lightest">Trait</span> Sets
          </h1>
          {props.preview && (
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/trait-sets`}
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
          {!props.preview && (
            <SearchWalletsDisplay
              searchWallets={searchWallets}
              setSearchWallets={setSearchWallets}
              setShowSearchModal={setShowSearchModal}
            />
          )}
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
              {traitsLoaded ? (
                <>
                  Unique values for <b>{selectedTrait}</b> trait: x
                  {selectedTraitValues.length.toLocaleString()}
                </>
              ) : (
                <DotLoader />
              )}
            </span>
            <span>
              {!setsLoaded ? (
                <DotLoader />
              ) : (
                <>Collectors Count: {totalResults.toLocaleString()}</>
              )}
            </span>
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
          <Col
            style={{
              minHeight: "50vh",
            }}>
            {!setsLoaded ? (
              <DotLoader />
            ) : (
              sets.map((s) => (
                <TraitSetAccordion
                  key={`collector-sets-${s.owner}`}
                  collection={props.collection}
                  trait={selectedTrait}
                  set={s}
                  values={selectedTraitValues}
                />
              ))
            )}
          </Col>
        </Row>
      )}
      {selectedTrait !== ULTIMATE && setsLoaded && sets.length === 0 && (
        <>No results found</>
      )}
      {selectedTrait === ULTIMATE && printUltimate()}
      {!props.preview &&
        totalResults > 0 &&
        totalResults / PAGE_SIZE > 1 &&
        setsLoaded && (
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
      {!props.preview ? (
        <SearchModalDisplay
          show={showSearchModal}
          setShow={setShowSearchModal}
          searchWallets={searchWallets}
          setSearchWallets={setSearchWallets}
        />
      ) : (
        setsLoaded && (
          <Row className="pt-3">
            <Col>
              <a
                href={`/nextgen/collection/${formatNameForUrl(
                  props.collection.name
                )}/trait-sets`}
                className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens} justify-content-center`}>
                <h5 className="mb-0 font-color d-flex align-items-center gap-2">
                  View All Trait Sets
                  <FontAwesomeIcon
                    icon="arrow-circle-right"
                    className={styles.viewAllIcon}
                  />
                </h5>
              </a>
            </Col>
          </Row>
        )
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
                {props.values.length > 0 && missingValues.length === 0 && (
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
            {props.values.length > 0 &&
              props.set.token_values?.map((tv) => (
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
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}/art?traits=${props.trait}:${tv.value}`}
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
                              src={getNextGenIconUrl(t)}
                              alt={`#${t.toString()}`}
                              onError={({ currentTarget }) => {
                                if (
                                  currentTarget.src === getNextGenIconUrl(t)
                                ) {
                                  currentTarget.src = getNextGenImageUrl(t);
                                }
                              }}
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
                    Not Seized:{" "}
                    {missingValues.map((mv, index) => (
                      <Fragment key={mv}>
                        <a
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}/art?traits=${props.trait}:${mv}`}
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
