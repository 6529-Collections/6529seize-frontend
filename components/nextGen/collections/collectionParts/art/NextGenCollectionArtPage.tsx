import NextGenCollectionHeader from "../NextGenCollectionHeader";
import NextGenCollectionArt from "../NextGenCollectionArt";
import type { NextGenCollection } from "@/entities/INextgen";
import NextGenNavigationHeader from "@/components/nextGen/collections/NextGenNavigationHeader";

interface Props {
  collection: NextGenCollection;
}

export default function NextGenCollectionArtPage(props: Readonly<Props>) {
  return (
    <>
      <NextGenNavigationHeader />
      <div className="tw-w-full tw-mx-auto tw-px-3 min-[1000px]:tw-max-w-[850px] min-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-7xl pt-4 pb-4">
        <div className="tw-flex tw-flex-wrap -tw-mx-3">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionHeader
              collection={props.collection}
              collection_link={true}
            />
          </div>
        </div>
        <div className="tw-flex tw-flex-wrap -tw-mx-3 pt-4">
          <div className="tw-relative tw-px-3 tw-w-full tw-basis-0 tw-grow tw-shrink-0">
            <NextGenCollectionArt collection={props.collection} />
          </div>
        </div>
      </div>
    </>
  );
}
