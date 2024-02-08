import { UserPageMintsPhaseSpot } from "./UserPageMints";

export default function UserPageMintsPhasesPhaseSpot({
  spot,
}: {
  readonly spot: UserPageMintsPhaseSpot;
}) {
  const spots = spot.items.reduce((acc, item) => acc + item.spots, 0);
  return (
    <tr>
      <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-medium tw-text-iron-300 sm:tw-pl-4">
        Palettes: {spot.name}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-text-iron-400">
        {spots}
      </td>
    </tr>
  );
}
