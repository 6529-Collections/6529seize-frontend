import EthereumIcon from "../utils/icons/EthereumIcon";
import { UserPageMintsPhase } from "./UserPageMints";
import UserPageMintsPhasesPhaseSpot from "./UserPageMintsPhasesPhaseSpot";
import UserPageMintsPhasesPhaseTimes from "./UserPageMintsPhasesPhaseTimes";

export default function UserPageMintsPhasesPhase({
  phase,
}: {
  readonly phase: UserPageMintsPhase;
}) {
  const totalSpots = phase.spots.reduce(
    (prev, curr) =>
      prev + curr.items.reduce((prev2, curr2) => prev2 + curr2.spots, 0),
    0
  );

  return (
    <>
      <div className="tw-mt-8 tw-flex tw-flex-col">
        <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
          {phase?.name}
        </span>
        <UserPageMintsPhasesPhaseTimes
          startTime={phase.startTime * 1000}
          endTime={phase.endTime * 1000}
        />
      </div>
      <div className="tw-mt-8 tw-flex tw-flex-col tw-max-w-md">
        <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
          Your Available Mints
        </span>
        <div className="tw-mt-2 tw-flex tw-flex-col">
          <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
            Mint Price
          </span>
          <span className="tw-mt-1 tw-inline-flex tw-items-center tw-text-iron-300 tw-font-medium tw-text-base">
            <div className="tw-h-5 tw-w-5">
              <EthereumIcon />
            </div>
            <span className="tw-mx-1">0.06529</span> / mint
          </span>
        </div>
        <div className="tw-mt-4 tw-flow-root">
          <div className="tw-bg-iron-950 tw-overflow-x-auto tw-shadow tw-ring-1 tw-ring-iron-700 tw-rounded-lg">
            <table className="tw-min-w-full">
              <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-700 tw-bg-iron-950">
                {phase.spots.map((spot) => (
                  <UserPageMintsPhasesPhaseSpot
                    key={`${phase.name}-${spot.name}`}
                    spot={spot}
                  />
                ))}
                <tr className="tw-bg-iron-900">
                  <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-semibold tw-text-iron-50 sm:tw-pl-4">
                    Total
                  </td>
                  <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-font-semibold tw-text-iron-50">
                    {totalSpots}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
