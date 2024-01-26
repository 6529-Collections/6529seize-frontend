import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";

export default function UserPageUpcoming({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const slug = router.query.slug as string;

  return (
    <div className="tw-divide-y tw-divide-gray-800">
      <div className="tw-flex">
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl sm:tw-tracking-tight">
          NextGen - Pebbles
        </h2>
      </div>
      <p className="tw-font-normal tw-text-iron-400 tw-text-sm sm:tw-text-base tw-mb-0">
        Congratulations! You are eligible to mint Pebbles in
        <span className="tw-pl-1 tw-font-semibold tw-text-iron-200">
          Phase 0.
        </span>
      </p>
      <div className="tw-mt-6 tw-flex tw-flex-col">
        <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
          Phase 0
        </span>
        <div className="tw-mt-1 tw-flex tw-flex-col">
          <span className="tw-text-iron-400 tw-text-base">Start Time:</span>
          <span className="tw-text-iron-400 tw-text-base">End Time:</span>
        </div>
      </div>
      <div className="tw-mt-6 tw-flex tw-flex-col">
        <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
          Minting Page
        </span>
        <div className="tw-mt-1">
          <a href="www.seize.io/nextgen/pebbles/mint" target="_blank">
            Link title
          </a>
        </div>
      </div>
      <div className="tw-mt-6 tw-flex tw-flex-col">
        <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
          Your Available Mints
        </span>
        <div className="tw-max-w-xs">
          <div className="tw-mt-1 tw-flex tw-flex-col tw-gap-y-1">
            <span className="tw-flex tw-justify-between tw-w-full">
              <span className="tw-text-iron-400 tw-text-base">
                Palettes: UltraMaxis
              </span>
              <span className="tw-text-iron-400 tw-text-base">1</span>
            </span>
            <span className="tw-flex tw-justify-between tw-w-full">
              <span className="tw-text-iron-400 tw-text-base">
                Palettes: HyperMaxis
              </span>
              <span className="tw-text-iron-400 tw-text-base">1</span>
            </span>
            <span className="tw-flex tw-justify-between tw-w-full">
              <span className="tw-text-iron-400 tw-text-base">
                Palettes: SetPEPE
              </span>
              <span className="tw-text-iron-400 tw-text-base">1</span>
            </span>
            <span className="tw-flex tw-justify-between tw-w-full">
              <span className="tw-text-iron-400 tw-text-base">
                Palettes: MemeMaxis
              </span>
              <span className="tw-text-iron-400 tw-text-base">3</span>
            </span>
            <span className="tw-pt-2 tw-mt-2 tw-flex tw-justify-between tw-w-full tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
              <span className="tw-text-iron-200 tw-text-base tw-font-medium">
                Total
              </span>
              <span className="tw-text-iron-200 tw-text-base tw-font-medium">
                6
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
