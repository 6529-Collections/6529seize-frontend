import styles from "../NextGen.module.scss";
import { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import { DBResponse } from "../../../../entities/IDBResponse";
import {
  NextGenCollection,
  NextgenTraitSet,
  TraitValues,
} from "../../../../entities/INextgen";
import { commonApiFetch } from "../../../../services/api/common-api";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { formatAddress } from "../../../../helpers/Helpers";

const PAGE_SIZE = 10;

export default function NextGenCollectorSets(
  props: Readonly<{
    collection: NextGenCollection;
  }>
) {
  const [page, setPage] = useState(1);

  const [traits, setTraits] = useState<TraitValues[]>([]);
  const [traitsLoaded, setTraitsLoaded] = useState(false);
  const [selectedTrait, setSelectedTrait] = useState<TraitValues>();

  const [sets, setSets] = useState<NextgenTraitSet[]>([]);
  const [setsLoaded, setSetsLoaded] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    commonApiFetch<TraitValues[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      setTraits(response.filter((t) => t.trait !== "Collection Name"));
      setTraitsLoaded(true);
      setSelectedTrait(response[0]);
    });
  }, [props.collection.id]);

  function fetchResults(mypage: number, mytrait: string) {
    setSetsLoaded(false);
    let url = `nextgen/collections/${props.collection.id}/trait_sets/${mytrait}?page_size=${PAGE_SIZE}&page=${mypage}`;
    commonApiFetch<DBResponse>({
      endpoint: url,
    }).then((response) => {
      setTotalResults(response.count);
      setSets(response.data);
      setSetsLoaded(true);
    });
  }

  useEffect(() => {
    if (selectedTrait) {
      if (page === 1) {
        fetchResults(page, selectedTrait?.trait);
      } else {
        setPage(1);
      }
    }
  }, [selectedTrait]);

  useEffect(() => {
    if (selectedTrait) {
      fetchResults(page, selectedTrait.trait);
    }
  }, [page]);

  return (
    <Container className="no-padding pt-4">
      <Row className="pb-3">
        <Col>
          <h1>
            <span className="font-lightest">Collector</span> Sets
          </h1>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <Table className={styles.logsTable}>
            <thead>
              <tr>
                <th>Collector x{totalResults}</th>
                <th className="text-center">Sets</th>
              </tr>
            </thead>
            <tbody>
              {sets.map((set) => (
                <tr key={getRandomObjectId()}>
                  <td>
                    <a
                      href={`/${set.handle ?? set.owner}`}
                      target="_blank"
                      rel="noreferrer"
                      className="decoration-hover-underline">
                      {set.normalised_handle ??
                        set.consolidation_display ??
                        formatAddress(set.owner)}
                    </a>
                  </td>
                  <td className="text-center">{set.distinct_values_count}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
