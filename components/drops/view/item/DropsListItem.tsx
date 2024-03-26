import { DropFull } from "../../../../entities/IDrop";
import { getTimeAgo } from "../../../../helpers/Helpers";
import DropPfp from "../../create/utils/DropPfp";
import DropListItemContent from "./content/DropListItemContent";

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  return (
    <div className="tw-border-solid tw-border tw-border-iron-800 tw-rounded-lg tw-bg-iron-900 tw-p-6">
      <div className="tw-flex tw-justify-between tw-w-full">
        <div className="tw-inline-flex tw-items-center tw-gap-x-3">
          <DropPfp pfpUrl={drop.author.pfp} />
          <p className="tw-mb-0 tw-text-base tw-font-semibold">
            {drop.author.handle}
          </p>
        </div>
        <span className="tw-whitespace-nowrap tw-font-normal tw-text-sm tw-text-iron-500">
          {getTimeAgo(drop.created_at)}
        </span>
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
