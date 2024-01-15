import styles from "../NextGen.module.scss";
import { Container, Row, Col, Dropdown, FormCheck } from "react-bootstrap";
import NextGenTokenList from "../NextGenTokenList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NextGenCollection } from "../../../../entities/INextgen";
import { use, useEffect, useState } from "react";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useRouter } from "next/router";

interface Props {
  collection: NextGenCollection;
  show_view_all?: boolean;
}

export default function NextGenCollectionArt(props: Readonly<Props>) {
  const router = useRouter();
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  useEffect(() => {
    if (router.query.traits) {
      setSelectedTraits(
        (router.query.traits as string).toLowerCase().split(",")
      );
    } else {
      setSelectedTraits([]);
    }
  }, [router.query.traits]);

  useEffect(() => {
    commonApiFetch<any[]>({
      endpoint: `nextgen/collections/${props.collection.id}/traits`,
    }).then((response) => {
      const traits = response.map((trait) => trait.trait);
      setTraits(traits);
    });
  }, [props.collection.id]);

  useEffect(() => {
    if (!props.show_view_all) {
      if (selectedTraits.length > 0) {
        router.push(
          `/nextgen/collection/${
            props.collection.id
          }/art?traits=${selectedTraits.join(",")}`,
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
  }, [props.show_view_all, selectedTraits]);

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
                <Col className="d-flex flex-column pt-2 pb-2">
                  {traits.map((tr) => (
                    <FormCheck
                      key={`trait-${tr.replaceAll(" ", "-")}`}
                      type="checkbox"
                      label={tr}
                      name="trait"
                      id={`trait-${tr.replaceAll(" ", "-")}`}
                      checked={selectedTraits.includes(tr.toLowerCase())}
                      className="pt-1 pb-1"
                      onChange={() => {
                        if (selectedTraits.includes(tr.toLowerCase())) {
                          setSelectedTraits(
                            selectedTraits.filter((t) => t !== tr.toLowerCase())
                          );
                        } else {
                          setSelectedTraits([
                            ...selectedTraits,
                            tr.toLowerCase(),
                          ]);
                        }
                      }}
                    />
                  ))}
                </Col>
              </Row>
            </Container>
          </Col>
        )}
        <Col sm={12} md={props.show_view_all ? 12 : 10}>
          <NextGenTokenList
            collection={props.collection}
            limit={props.show_view_all ? 9 : undefined}
            selected_traits={selectedTraits}
          />
        </Col>
      </Row>
    </Container>
  );
}
