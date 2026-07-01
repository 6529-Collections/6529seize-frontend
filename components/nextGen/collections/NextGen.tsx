import type { NextGenCollection } from "@/entities/INextgen";
import { NextgenView } from "@/types/enums";
import Link from "next/link";
import { Status } from "../nextgen_entities";
import { formatNameForUrl, getStatusFromDates } from "../nextgen_helpers";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "./collectionParts/NextGenCollectionHeader";
import NextGenCollectionSlideshow from "./collectionParts/NextGenCollectionSlideshow";
import styles from "./NextGen.module.scss";

interface Props {
  collection: NextGenCollection;
  setView: (view: NextgenView) => void;
}

export default function NextGen(props: Readonly<Props>) {
  const available = props.collection.total_supply - props.collection.mint_count;

  return (
    <>
      <div className={styles["nextgenBannerWrapper"]}>
        <div
          className={styles["nextgenBanner"]}
          style={{ background: `url(${props.collection.banner})` }}
        />
        <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl tw-z-10">
          <div className="tw-flex tw-flex-wrap -tw-mx-3">
            <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
              <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-5 pb-5 no-padding">
                <div className="tw-flex tw-flex-wrap -tw-mx-3">
                  <div className="tw-relative tw-px-3 tw-w-full tw-basis-auto tw-grow-0 tw-shrink-0 min-[576px]:tw-basis-auto min-[576px]:tw-grow-0 min-[576px]:tw-shrink-0 min-[576px]:tw-w-full md:tw-basis-auto md:tw-grow-0 md:tw-shrink-0 md:tw-w-1/2" style={{ maxWidth: "100%" }}>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        <NextGenPhases
                          collection={props.collection}
                          available={available}
                        />
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-2">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                          className="decoration-none font-bolder"
                          style={{ fontSize: "60px" }}
                        >
                          {props.collection.name}
                        </Link>
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3 font-larger font-color font-bolder">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 font-larger font-lighter" style={{ fontSize: "48px", lineHeight: "48px" }}>
                        by{" "}
                        <Link
                          href={`/${props.collection.artist_address}`}
                          className="decoration-hover-underline"
                        >
                          {props.collection.artist}
                        </Link>
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-3 font-larger font-color">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        <NextGenMintCounts collection={props.collection} />
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-3">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                        >
                          <button
                            className={`font-larger pt-2 pb-2 no-wrap ${styles["exploreBtn"]}`}
                          >
                            <span className="font-larger">
                              Explore Collection
                            </span>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4 pb-2">
                      <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                        <NextGenCountdown collection={props.collection} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-w-full tw-max-w-none pt-5 pb-5" style={{ backgroundColor: "black" }}>
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-3 pb-3">
              <div className="tw-flex tw-flex-wrap -tw-mx-3">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 font-larger text-center">
                  <b>NextGen</b> is an on-chain generative art NFT contract. It
                  is also a tool to support the ambitious aspirations of the
                  6529 community in the areas of art experimentation and
                  decentralized social organization.
                  <br />
                  <button
                    className="btn-link pt-2"
                    onClick={() => {
                      props.setView(NextgenView.ABOUT);
                      window.scrollTo(0, 120);
                    }}
                  >
                    <span className="font-larger">Learn More</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-5">
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <h1>Explore {props.collection.name}</h1>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionSlideshow collection={props.collection} />
          </div>
        </div>
      </div>
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-5 pb-5">
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <h1>Featured Artist</h1>
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionArtist collection={props.collection} />
          </div>
        </div>
      </div>
    </>
  );
}

export function DistributionLink(
  props: Readonly<{
    collection: NextGenCollection;
    class?: string | undefined;
  }>
) {
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  const publicStatus = getStatusFromDates(
    props.collection.public_start,
    props.collection.public_end
  );

  if (
    alStatus === Status.UPCOMING ||
    alStatus === Status.LIVE ||
    publicStatus !== Status.COMPLETE
  ) {
    return (
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl no-padding">
        <div className={`tw-flex tw-flex-wrap -tw-mx-3 pt-1 font-color ${props.class ? props.class : ""}`}>
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <Link
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/distribution-plan`}
            >
              Distribution Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <></>;
}
