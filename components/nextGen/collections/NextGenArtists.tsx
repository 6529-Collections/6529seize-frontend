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
  const [artistsLoaded, setArtistsLoaded] = useState(false);
  const [artistsError, setArtistsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setArtistsLoaded(false);
    setArtistsError(false);
    const url = `${publicEnv.API_ENDPOINT}/api/nextgen/collections`;
    void fetchUrl<DBResponse<NextGenCollection>>(url)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setArtistCollections(
          response.data.reduce<
            { address: string; collections: NextGenCollection[] }[]
          >((acc, collection) => {
            if (
              !acc.find((a) =>
                areEqualAddresses(a.address, collection.artist_address)
              )
            ) {
              acc.push({
                address: collection.artist_address,
                collections: response.data
                  .filter((c) =>
                    areEqualAddresses(
                      c.artist_address,
                      collection.artist_address
                    )
                  )
                  .sort((a, b) => a.id - b.id),
              });
            }
            return acc;
          }, [])
        );
        setArtistsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setArtistCollections([]);
          setArtistsError(true);
          setArtistsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="tw-py-6 sm:tw-py-8">
      <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-3xl">
        Artists
      </h1>

      <div className="tw-mt-6 tw-space-y-4" aria-busy={!artistsLoaded}>
        {!artistsLoaded &&
          [0, 1, 2].map((skeleton) => (
            <div
              key={`artist-skeleton-${skeleton}`}
              className="tw-flex tw-gap-5 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-5"
              aria-hidden="true"
            >
              <div className="tw-h-24 tw-w-24 tw-shrink-0 tw-animate-pulse tw-rounded-lg tw-bg-iron-800 motion-reduce:tw-animate-none" />
              <div className="tw-flex-1 tw-space-y-3 tw-py-2">
                <div className="tw-h-5 tw-w-1/3 tw-animate-pulse tw-rounded-md tw-bg-iron-700 motion-reduce:tw-animate-none" />
                <div className="tw-h-4 tw-w-1/2 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
                <div className="tw-h-4 tw-w-4/5 tw-animate-pulse tw-rounded-md tw-bg-iron-800 motion-reduce:tw-animate-none" />
              </div>
            </div>
          ))}

        {artistsLoaded &&
          !artistsError &&
          artistCollections.map((artist) => (
            <NextGenCollectionArtist
              key={`nextgen-artist-${artist.address}`}
              collection={artist.collections[0]!}
              link_collections={artist.collections}
            />
          ))}

        {artistsError && (
          <div
            role="alert"
            className="tw-rounded-xl tw-border tw-border-solid tw-border-error/40 tw-bg-error/10 tw-px-6 tw-py-12 tw-text-center tw-text-error"
          >
            Unable to load artists. Refresh the page to try again.
          </div>
        )}

        {artistsLoaded && !artistsError && artistCollections.length === 0 && (
          <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-900/50 tw-px-6 tw-py-12 tw-text-center">
            <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-200">
              No artists found
            </h2>
          </div>
        )}
      </div>
    </section>
  );
}
