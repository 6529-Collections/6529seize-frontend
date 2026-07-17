"use client";

import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import type { NextGenCollection } from "@/entities/INextgen";
import type { CicStatement } from "@/entities/IProfile";
import { STATEMENT_TYPE } from "@/helpers/Types";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  collection: NextGenCollection;
  headingLevel?: 2 | 3 | undefined;
  link_collections?: NextGenCollection[] | undefined;
}

export default function NextGenCollectionArtist(props: Readonly<Props>) {
  const [bio, setBio] = useState("");
  const { profile } = useIdentity({
    handleOrWallet: props.collection.artist_address,
    initialProfile: null,
  });

  useEffect(() => {
    let cancelled = false;

    void commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${props.collection.artist_address}/cic/statements`,
    })
      .then((statements) => {
        if (cancelled) {
          return;
        }

        const bioStatement = statements.find(
          (statement) => statement.statement_type === STATEMENT_TYPE.BIO
        );
        setBio(bioStatement?.statement_value ?? "");
      })
      .catch(() => {
        if (!cancelled) {
          setBio("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.collection.artist_address]);

  const profileHref = `/${profile?.handle ?? props.collection.artist_address}`;
  const Heading = props.headingLevel === 3 ? "h3" : "h2";

  return (
    <article className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-5 tw-shadow-lg sm:tw-p-6">
      <div
        className={`tw-grid tw-gap-5 sm:tw-gap-6 ${
          profile?.pfp ? "md:tw-grid-cols-[180px_minmax(0,1fr)]" : ""
        }`}
      >
        {profile?.pfp && (
          <Link
            href={profileHref}
            className="tw-block tw-overflow-hidden tw-rounded-lg focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <Image
              unoptimized
              width={400}
              height={400}
              sizes="(max-width: 768px) 100vw, 180px"
              src={profile.pfp}
              alt={`${props.collection.artist} profile`}
              className="tw-aspect-square tw-h-full tw-w-full tw-object-cover tw-transition tw-duration-300 hover:tw-scale-[1.02] motion-reduce:tw-transform-none"
            />
          </Link>
        )}

        <div className="tw-min-w-0">
          <Heading className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-white sm:tw-text-2xl">
            {props.collection.artist}
          </Heading>

          {profile?.handle && (
            <Link
              href={`/${profile.handle}`}
              className="tw-mt-2 tw-inline-flex tw-rounded-md tw-text-base tw-font-medium tw-text-primary-300 hover:tw-text-primary-300 hover:tw-underline focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              @{profile.handle}
            </Link>
          )}

          {props.link_collections && (
            <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <p className="tw-mb-0 tw-mr-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-400">
                Collection{props.link_collections.length > 1 ? "s" : ""}
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-2">
                {props.link_collections.map((collection) => (
                  <Link
                    key={`link-collection-${collection.id}`}
                    href={`/nextgen/collection/${formatNameForUrl(
                      collection.name
                    )}`}
                    className="tw-inline-flex tw-min-h-9 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-200 tw-no-underline tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {bio && (
            <p className="tw-mb-0 tw-mt-5 tw-max-w-3xl tw-whitespace-pre-line tw-text-base tw-leading-7 tw-text-white">
              {bio}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
