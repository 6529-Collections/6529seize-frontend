"use client";

import DotLoader from "@/components/dotLoader/DotLoader";
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
  const [artistCollectionsLoaded, setArtistCollectionsLoaded] = useState(false);

  async function fetchResults() {
    setArtistCollectionsLoaded(false);
    let url = `${publicEnv.API_ENDPOINT}/api/nextgen/collections`;
    try {
      const response = await fetchUrl(url);
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
    } catch (error) {
      console.error("Failed to fetch NextGen artist collections", error);
      setArtistCollections([]);
    } finally {
      setArtistCollectionsLoaded(true);
    }
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
      {!artistCollectionsLoaded && (
        <Row className="pt-4 pb-4">
          <Col className="text-center">
            <DotLoader />
          </Col>
        </Row>
      )}
      {artistCollectionsLoaded && artistCollections.length === 0 && (
        <Row>
          <Col className="text-center">
            <h4>No artist collections found</h4>
          </Col>
        </Row>
      )}
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
