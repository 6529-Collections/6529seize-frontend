import Image from "next/image";
import Link from "next/link";
import type { NextGenCollection } from "@/entities/INextgen";
import { formatNameForUrl } from "../nextgen_helpers";
import { NextGenMintCounts } from "./collectionParts/NextGenCollectionHeader";
import styles from "./NextGen.module.scss";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionPreview(props: Readonly<Props>) {
  return (
    <Link
      href={`/nextgen/collection/${formatNameForUrl(props.collection.name)}`}
      className="decoration-none"
    >
      <div className={`tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl ${styles["collectionPreview"]}`}>
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 pb-4">
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
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <div className={`tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl ${styles["collectionPreviewTitle"]}`}>
              <div className="tw-flex tw-flex-wrap -tw-mx-3">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                  <h3 className="mb-0">{props.collection.name}</h3>
                </div>
              </div>
              <div className="tw-flex tw-flex-wrap -tw-mx-3">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
                  by <b>{props.collection.artist}</b>
                </div>
              </div>
              <div className="tw-flex tw-flex-wrap -tw-mx-3">
                <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0 font-color-h d-flex">
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
