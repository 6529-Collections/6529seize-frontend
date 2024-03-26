import { DropFull } from "../../../../entities/IDrop";
import CommonTimeAgo from "../../../utils/CommonTimeAgo";
import DropPfp from "../../create/utils/DropPfp";
import DropListItemContent from "./content/DropListItemContent";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  return (
    <div className="tw-border-solid tw-border-[1px] tw-border-neutral-600 tw-rounded-md tw-p-4">
      <div className="tw-inline-flex tw-justify-between tw-w-full">
        <div className="tw-inline-flex tw-items-center">
          <DropPfp pfpUrl={drop.author.pfp} />
          <div>{drop.author.handle}</div>
        </div>
        <CommonTimeAgo timestamp={drop.created_at} />
      </div>
      <DropListItemContent drop={drop} />
      <div className="tw-border-t tw-inline-flex tw-space-x-2">
        <div>Discuss</div>
        <div>Redrop</div>
        <div>Share</div>
      </div>
    </div>
  );
}
