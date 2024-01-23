import { Container, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import { DBResponse } from "../../../entities/IDBResponse";
import { fetchUrl } from "../../../services/6529api";
import { NextGenCollection } from "../../../entities/INextgen";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";
import { areEqualAddresses } from "../../../helpers/Helpers";

export default function NextGenCollections() {
  const [artistCollections, setArtistCollections] = useState<
    { address: string; collections: NextGenCollection[] }[]
  >([]);

  function fetchResults() {
    let url = `${process.env.API_ENDPOINT}/api/nextgen/collections`;
    fetchUrl(url).then((response: DBResponse) => {
      setArtistCollections(
        response.data.reduce((acc, collection) => {
          if (
            !acc.find((a: any) =>
              areEqualAddresses(a.address, collection.artist_address)
            )
          ) {
            acc.push({
              address: collection.artist_address,
              collections: response.data
                .filter((c) =>
                  areEqualAddresses(c.artist_address, collection.artist_address)
                )
                .sort((a, b) => a.id - b.id),
            });
          }
          return acc;
        }, [])
      );
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
      {artistCollections.map(
        (
          ac: {
            address: string;
            collections: NextGenCollection[];
          },
          index: number
        ) => {
          return (
            <Row key={`nextgen-artist-${ac.address}`}>
              {index === 0 && (
                <Col xs={12}>
                  <hr />
                </Col>
              )}
              <Col>
                <NextGenCollectionArtist
                  collection={ac.collections[0]}
                  link_collections={ac.collections}
                />
              </Col>
              <Col xs={12} className="pt-4">
                <hr />
              </Col>
            </Row>
          );
        }
      )}
    </Container>
  );
}
