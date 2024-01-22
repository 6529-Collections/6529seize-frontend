import { Container, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../../entities/IDBResponse";
import { fetchUrl } from "../../../services/6529api";
import { NextGenCollection } from "../../../entities/INextgen";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";

export default function NextGenCollections() {
  const [collections, setCollections] = useState<NextGenCollection[]>([]);

  function fetchResults() {
    let url = `${process.env.API_ENDPOINT}/api/nextgen/collections`;
    fetchUrl(url).then((response: DBResponse) => {
      setCollections(response.data);
    });
  }

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <Container className="no-padding">
      <Row className="pt-3 pb-3">
        <Col>
          <h1>ARTISTS</h1>
        </Col>
      </Row>
      {collections.map((collection: NextGenCollection, index: number) => {
        return (
          <Row key={collection.id}>
            {index === 0 && (
              <Col xs={12}>
                <hr />
              </Col>
            )}
            <Col>
              <NextGenCollectionArtist
                collection={collection}
                link_collection={true}
              />
            </Col>
            <Col xs={12} className="pt-4">
              <hr />
            </Col>
          </Row>
        );
      })}
    </Container>
  );
}
