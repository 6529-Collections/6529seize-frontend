"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";
import type { DBResponse } from "@/entities/IDBResponse";
import type { NextGenCollection } from "@/entities/INextgen";
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
    <div className="no-padding pt-4 pb-4 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="pb-3 -tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <h1>Artists</h1>
        </div>
      </div>
      {artistCollections.map(
        (ac: { address: string; collections: NextGenCollection[] }) => {
          return (
            <div
              className="-tw-mx-3 tw-flex tw-flex-wrap"
              key={`nextgen-artist-${ac.address}`}
            >
              <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                <NextGenCollectionArtist
                  collection={ac.collections[0]!}
                  link_collections={ac.collections}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
