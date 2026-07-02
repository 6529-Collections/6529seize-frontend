"use client";

import type { NextGenCollection } from "@/entities/INextgen";
import type { CicStatement } from "@/entities/IProfile";
import { STATEMENT_TYPE } from "@/helpers/Types";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";

interface Props {
  collection: NextGenCollection;
  link_collections?: NextGenCollection[] | undefined;
}

export default function NextGenCollectionArtist(props: Readonly<Props>) {
  const [bio, setBio] = useState<string>("");

  const { profile } = useIdentity({
    handleOrWallet: props.collection.artist_address,
    initialProfile: null,
  });

  useEffect(() => {
    commonApiFetch<CicStatement[]>({
      endpoint: `profiles/${props.collection.artist_address}/cic/statements`,
    }).then((statements) => {
      const bioStatement = statements.find(
        (s) => s.statement_type === STATEMENT_TYPE.BIO
      );
      setBio(bioStatement?.statement_value ?? "");
    });
  }, []);

  return (
    <div className="!tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div
          className="tw-pt-6 tw-flex tw-items-center tw-justify-center tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/4 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
          {profile?.pfp && (
            <Image
              unoptimized
              priority
              loading="eager"
              width={0}
              height={0}
              style={{
                height: "auto",
                width: "100%",
              }}
              src={profile.pfp}
              alt={props.collection.artist}
              className="tw-cursor-pointer"
            />
          )}
        </div>
        <div
          className="tw-pt-6 tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-3/4 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
          style={{ maxWidth: "100%" }}
        >
          <div className="!tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <div className="-tw-mx-3 tw-flex tw-flex-wrap">
              <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                <h3 className="tw-mb-0 tw-text-white">{props.collection.artist}</h3>
              </div>
            </div>
            {profile?.handle && (
              <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  <Link href={`/${profile?.handle}`}>@{profile?.handle}</Link>
                </div>
              </div>
            )}
            {props.link_collections && (
              <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  Collection{props.link_collections.length > 1 ? "s" : ""}:{" "}
                  {props.link_collections.map((c, index) => (
                    <Fragment key={`link-collection-${c.id}`}>
                      {index > 0 && ", "}
                      <Link
                        key={`link-collection-${c.id}`}
                        href={`/nextgen/collection/${formatNameForUrl(c.name)}`}
                      >
                        {c.name}
                      </Link>
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
            <div className="tw-pt-6 -tw-mx-3 tw-flex tw-flex-wrap">
              <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                {bio}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
