import Image from "next/image";
import Link from "next/link";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatNameForUrl } from "../nextgen_helpers";
import { NextGenMintCounts } from "./collectionParts/NextGenCollectionHeader";
import styles from "./NextGen.module.css";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  return (
    <Link
      href={`/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
      className="tw-no-underline"
    >
      <div
        className={`tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] ${styles["collectionPreview"]}`}
      >
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-pb-6">
            <Image
              unoptimized
              priority
              loading={"eager"}
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "100%",
                maxWidth: "100%",
                padding: "10px",
              }}
              src={props.collection.image}
              alt={`NextGen Collection #${props.collection.id} - ${props.collection.name}`}
              onError={(e) => {
                e.currentTarget.src = "/pebbles-loading.jpeg";
              }}
            />
          </div>
        </div>
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
            <div
              className={`tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] ${styles["collectionPreviewTitle"]}`}
            >
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  <h3 className="tw-mb-0">{props.collection.name}</h3>
                </div>
              </div>
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
                  by <b>{props.collection.artist}</b>
                </div>
              </div>
              <div className="-tw-mx-3 tw-flex tw-flex-wrap">
                <div className="tw-relative tw-flex tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3 tw-text-[#9a9a9a]">
                  <NextGenMintCounts collection={props.collection} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
