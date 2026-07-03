import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import styles from "../NextGen.module.css";
import SlideshowHeader from "./hooks/SlideshowHeader";
import TokenSlideshow from "./hooks/TokenSlideshow";

interface Props {
  readonly collection: NextGenCollection;
  readonly initialTokens?: NextGenToken[] | undefined;
}

export default function NextGenCollectionSlideshow(props: Readonly<Props>) {
  return (
    <div className={`tw-w-full tw-max-w-none ${styles["slideshowContainer"]}`}>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          <div className="tw-mx-auto tw-w-full tw-px-3 tw-pb-4 tw-pt-4 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
            <SlideshowHeader collectionName={props.collection.name} />
            <TokenSlideshow
              collectionId={props.collection.id}
              initialTokens={props.initialTokens}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
