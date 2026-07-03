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
        <div className="tw-z-10 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
          <div className="-tw-mx-3 tw-flex tw-flex-wrap">
            <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
              <div className="tw-pt-12 tw-pb-12 !tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
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
                    <div className="tw-pt-2 -tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                          className="tw-no-underline tw-font-bold"
                          style={{ fontSize: "60px" }}
                        >
                          {props.collection.name}
                        </Link>
                      </div>
                    </div>
                    <div className="tw-text-lg tw-text-white tw-font-bold -tw-mx-3 tw-flex tw-flex-wrap">
                      <div
                        className="tw-text-lg tw-font-extralight tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3"
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
                    <div className="tw-pt-4 tw-text-lg tw-text-white -tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <NextGenMintCounts collection={props.collection} />
                      </div>
                    </div>
                    <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
                      <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                        <Link
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                        >
                          <button
                            className={`tw-text-lg tw-pt-2 tw-pb-2 tw-whitespace-nowrap tw-min-w-fit ${styles["exploreBtn"]}`}
                          >
                            <span className="tw-text-lg">
                              Explore Collection
                            </span>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="tw-pt-6 tw-pb-2 -tw-mx-3 tw-flex tw-flex-wrap">
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
        className="tw-pt-12 tw-pb-12 tw-w-full tw-max-w-none"
        style={{ backgroundColor: "black" }}
      >
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <div className="tw-pt-4 tw-pb-4 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-text-lg tw-text-center tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  <b>NextGen</b> is an on-chain generative art NFT contract. It
                  is also a tool to support the ambitious aspirations of the
                  6529 community in the areas of art experimentation and
                  decentralized social organization.
                  <br />
                  <button
                    className="tw-border-0 tw-bg-transparent !tw-p-0 tw-font-[inherit] tw-text-inherit tw-cursor-pointer tw-outline-[inherit] hover:tw-bg-transparent focus:tw-bg-transparent active:tw-bg-transparent hover:tw-text-[#9a9a9a] focus:tw-text-[#9a9a9a] active:tw-text-[#9a9a9a] tw-pt-2"
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
      <div className="tw-pt-12 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <h1>Explore {props.collection.name}</h1>
          </div>
        </div>
        <div className="tw-pt-4 -tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <NextGenCollectionSlideshow collection={props.collection} />
          </div>
        </div>
      </div>
      <div className="tw-pt-12 tw-pb-12 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
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
      <div className="!tw-p-0 tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
        <div
          className={`tw-pt-1 tw-text-white -tw-mx-3 tw-flex tw-flex-wrap ${props.class ? props.class : ""}`}
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
