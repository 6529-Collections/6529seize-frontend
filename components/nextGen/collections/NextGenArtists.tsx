"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { DBResponse } from "@/entities/IDBResponse";
import { NextGenCollection } from "@/entities/INextgen";
import { areEqualAddresses } from "@/helpers/Helpers";
import { fetchUrl } from "@/services/6529api";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";

export default function NextGenArtists() {
  const [artistCollections, setArtistCollections] = useState<
    { address: string; collections: NextGenCollection[] }[]
  >([]);

  function fetchResults() {
    let url = `${publicEnv.API_ENDPOINT}/api/nextgen/collections`;
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
    <Container className="no-padding pt-4 pb-4">
      <Row className="pb-3">
        <Col>
          <h1>Artists</h1>
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
              <Col>
                <NextGenCollectionArtist
                  collection={ac.collections[0]}
                  link_collections={ac.collections}
                />
              </Col>
            </Row>
          );
        }
      )}
    </Container>
  );
}
