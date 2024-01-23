import Link from "next/link";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import {
  formatNumberWithCommasOrDash,
  getTimeAgo,
} from "../../../../../helpers/Helpers";
import {
  DistributionCollection,
  DistributionTableItem,
} from "./UserPageStatsActivityDistributionsTable";
import { useEffect, useState } from "react";

export default function UserPageStatsActivityDistributionsTableItem({
  item,
}: {
  readonly item: DistributionTableItem;
}) {
  const COLLECTION_TO_TEXT: { [key in DistributionCollection]: string } = {
    [DistributionCollection.MEMES]: "The Memes",
    [DistributionCollection.GRADIENTS]: "6529Gradient",
    [DistributionCollection.MEMELAB]: "Meme Lab",
  };

  const COLLECTION_TO_PATH: { [key in DistributionCollection]: string } = {
    [DistributionCollection.MEMES]: "/the-memes",
    [DistributionCollection.GRADIENTS]: "/6529-gradient",
    [DistributionCollection.MEMELAB]: "/meme-lab",
  };

  const [timeAgo, setTimeAgo] = useState<string>("");
  useEffect(() => {
    setTimeAgo(getTimeAgo(new Date(item.date).getTime()));
  }, []);

  return (
    <tr>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base">
        {COLLECTION_TO_TEXT[item.collection]}
      </td>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-medium tw-px-4 sm:tw-px-6 tw-text-right tw-whitespace-nowrap tw-text-base">
        <Link
          className="tw-no-underline hover:tw-underline"
          href={`${COLLECTION_TO_PATH[item.collection]}/${item.tokenId}`}
        >
          # {item.tokenId}
        </Link>
      </td>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base">
        {item.name}
      </td>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base">
        {item.wallet}
      </td>
      {item.phases.map((phase) => (
        <td
          key={getRandomObjectId()}
          className="tw-text-iron-500 tw-py-2.5 tw-font-normal tw-px-4 tw-text-right sm:tw-px-6 tw-whitespace-nowrap tw-text-base"
        >
          {formatNumberWithCommasOrDash(phase)}
        </td>
      ))}
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right">
        {formatNumberWithCommasOrDash(item.amountMinted)}
      </td>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-medium tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right">
        {formatNumberWithCommasOrDash(item.amountTotal)}
      </td>
      <td className="tw-text-iron-500 tw-py-2.5 tw-font-normal tw-px-4 sm:tw-px-6 tw-whitespace-nowrap tw-text-base tw-text-right">
        {timeAgo}
      </td>
    </tr>
  );
}
