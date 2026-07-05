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
import styles from "./NextGen.module.css";

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
        <div className="tw-z-10 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <div className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 tw-pb-12 tw-pt-12 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
                <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                  <div
                    className="tw-relative tw-w-full tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3 min-[576px]:tw-w-full min-[576px]:tw-shrink-0 min-[576px]:tw-grow-0 min-[576px]:tw-basis-auto md:tw-w-1/2 md:tw-shrink-0 md:tw-grow-0 md:tw-basis-auto"
                    style={{ maxWidth: "100%" }}
                  >
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <NextGenPhases
                          collection={props.collection}
                          available={available}
                        />
                      </div>
                    </div>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-2">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                          className="tw-font-bold tw-no-underline"
                          style={{ fontSize: "60px" }}
                        >
                          {props.collection.name}
                        </Link>
                      </div>
                    </div>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-text-lg tw-font-bold tw-text-white">
                      <div
                        className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-text-lg tw-font-extralight"
                        style={{ fontSize: "48px", lineHeight: "48px" }}
                      >
                        by{" "}
                        <Link
                          href={`/${props.collection.artist_address}`}
                          className="tw-no-underline hover:tw-underline"
                        >
                          {props.collection.artist}
                        </Link>
                      </div>
                    </div>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4 tw-text-lg tw-text-white">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <NextGenMintCounts collection={props.collection} />
                      </div>
                    </div>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                        >
                          <button
                            className={`tw-min-w-fit tw-whitespace-nowrap tw-pb-2 tw-pt-2 tw-text-lg ${styles["exploreBtn"]}`}
                          >
                            <span className="tw-text-lg">
                              Explore Collection
                            </span>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-2 tw-pt-6">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
      <div
        className="tw-w-full tw-max-w-none tw-px-3 tw-pb-12 tw-pt-12"
        style={{ backgroundColor: "black" }}
      >
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-4 tw-pt-4 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-text-center tw-text-lg">
                  <b>NextGen</b> is an on-chain generative art NFT contract. It
                  is also a tool to support the ambitious aspirations of the
                  6529 community in the areas of art experimentation and
                  decentralized social organization.
                  <br />
                  <button
                    className="tw-cursor-pointer tw-border-0 tw-bg-transparent !tw-p-0 tw-pt-2 tw-font-[inherit] tw-text-inherit tw-outline-[inherit] hover:tw-bg-transparent hover:tw-text-[#9a9a9a] focus:tw-bg-transparent focus:tw-text-[#9a9a9a] active:tw-bg-transparent active:tw-text-[#9a9a9a]"
                    onClick={() => {
                      props.setView(NextgenView.ABOUT);
                      window.scrollTo(0, 120);
                    }}
                  >
                    <span className="tw-text-lg">Learn More</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pt-12 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h1>Explore {props.collection.name}</h1>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionSlideshow collection={props.collection} />
          </div>
        </div>
      </div>
      <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-12 tw-pt-12 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h1>Featured Artist</h1>
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
      <div className="tw-mx-auto tw-w-full !tw-p-0 tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div
          className={`-tw-mx-3 tw-flex tw-flex-wrap tw-pt-1 tw-text-white ${props.class ? props.class : ""}`}
        >
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
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
