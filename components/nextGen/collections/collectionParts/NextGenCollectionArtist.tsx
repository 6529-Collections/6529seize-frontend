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
    <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding">
      <div className="tw-flex tw-flex-wrap -tw-mx-3">
        <div className="tw-relative tw-px-3 tw-w-full tw-basis-auto tw-grow-0 tw-shrink-0 min-[576px]:tw-basis-auto min-[576px]:tw-grow-0 min-[576px]:tw-shrink-0 min-[576px]:tw-w-full md:tw-basis-auto md:tw-grow-0 md:tw-shrink-0 md:tw-w-1/4 pt-4 d-flex align-items-center justify-content-center" style={{ maxWidth: "100%" }}>
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
              className="cursor-pointer"
            />
          )}
        </div>
        <div className="tw-relative tw-px-3 tw-w-full tw-basis-auto tw-grow-0 tw-shrink-0 min-[576px]:tw-basis-auto min-[576px]:tw-grow-0 min-[576px]:tw-shrink-0 min-[576px]:tw-w-full md:tw-basis-auto md:tw-grow-0 md:tw-shrink-0 md:tw-w-3/4 pt-4" style={{ maxWidth: "100%" }}>
          <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding">
            <div className="tw-flex tw-flex-wrap -tw-mx-3">
              <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                <h3 className="font-color mb-0">{props.collection.artist}</h3>
              </div>
            </div>
            {profile?.handle && (
              <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-3">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                  <Link href={`/${profile?.handle}`}>@{profile?.handle}</Link>
                </div>
              </div>
            )}
            {props.link_collections && (
              <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
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
            <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4">
              <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">{bio}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
