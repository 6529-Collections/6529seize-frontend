import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import EthereumIcon from "../utils/icons/EthereumIcon";

export default function UserPageUpcoming({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const slug = router.query.slug as string;

  return (
    <div className="tailwind-scope">
      <div className="tw-divide-y tw-divide-iron-800">
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
        <div className="tw-mt-8 tw-flex tw-flex-col">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Minting Page
          </span>
          <div className="tw-mt-1">
            <a
              href="www.seize.io/nextgen/pebbles/mint"
              className="tw-group tw-inline-flex tw-items-center tw-text-primary-300 hover:tw-text-primary-400 tw-font-medium tw-text-base tw-duration-300 tw-transition tw-ease-out"
              target="_blank"
            >
              <span>seize.io/nextgen/pebbles/mint</span>
              <svg
                className="tw-h-6 tw-w-6 tw-ml-2 tw-text-primary-300 group-hover:tw-text-primary-400 tw-duration-400 tw-transition tw-ease-out group-hover:-tw-translate-y-0.5 group-hover:tw-translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="tw-mt-8 tw-flex tw-flex-col">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Phase 0
          </span>
          <div className="tw-mt-2 tw-flex tw-gap-x-8">
            <div className="tw-flex tw-flex-col">
              <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
                Start Time
              </span>
              <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
                Friday, Feb 2, 10:00 UTC
              </span>
            </div>
            <div className="tw-flex tw-flex-col">
              <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
                End Time
              </span>
              <span className="tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
                Friday, Feb 2, 10:00 UTC
              </span>
            </div>
            <div className="tw-flex tw-flex-col">
              <span className="tw-text-iron-400 tw-text-sm tw-font-medium">
                Countdown
              </span>
              <span className="tw-inline-flex tw-items-center tw-mt-1 tw-text-iron-300 tw-font-medium tw-text-base">
                <svg
                  className="tw-h-5 tw-w-5 tw-mr-2 tw-text-primary-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>4 Days 3 Hours 10 Minutes 14 Seconds</span>
              </span>
            </div>
          </div>
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
                  <tr>
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-medium tw-text-iron-300 sm:tw-pl-4">
                      Palettes: UltraMaxis
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-text-iron-400">
                      1
                    </td>
                  </tr>
                  <tr>
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-medium tw-text-iron-300 sm:tw-pl-4">
                      Palettes: HyperMaxis
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-text-iron-400">
                      1
                    </td>
                  </tr>
                  <tr>
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-medium tw-text-iron-300 sm:tw-pl-4">
                      Palettes: SgtPEPE
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-text-iron-400">
                      1
                    </td>
                  </tr>
                  <tr>
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-medium tw-text-iron-300 sm:tw-pl-4">
                      Palettes: MemeMaxis
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-text-iron-400">
                      3
                    </td>
                  </tr>
                  <tr className="tw-bg-iron-900">
                    <td className="tw-whitespace-nowrap tw-py-2.5 tw-pl-4 tw-pr-3 tw-text-md tw-font-semibold tw-text-iron-50 sm:tw-pl-4">
                      Total
                    </td>
                    <td className="tw-whitespace-nowrap tw-px-3 tw-py-2.5 tw-text-md tw-font-semibold tw-text-iron-50">
                      6
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="tw-mt-8 tw-flex tw-flex-col">
          <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Your Minting Addresses
          </span>
          <p className="tw-mb-0 tw-mt-1 tw-text-iron-400 tw-text-sm tw-font-medium">
            You can mint from any of the following addresses
          </p>
          <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-1.5 ">
            <div className="tw-inline-flex tw-items-center">
              <svg
                className="tw-h-5 tw-w-5 tw-mr-2 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="tw-text-iron-300 tw-font-medium tw-text-base">
                6529.eth
              </span>
            </div>
            <div className="tw-inline-flex tw-items-center">
              <svg
                className="tw-h-5 tw-w-5 tw-mr-2 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tw-text-iron-300 tw-font-medium tw-text-base">
                mint.6529.eth
              </span>
            </div>
            <div className="tw-inline-flex tw-items-center">
              <svg
                className="tw-h-5 tw-w-5 tw-mr-2 tw-text-iron-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="tw-text-iron-300 tw-font-medium tw-text-base">
                0x65295343
              </span>
            </div>
          </div>
        </div>
        <div className="tw-mt-6">
          <p className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
            To change your minting address, change your minting delegate for All
            NFTs or The Memes in the{" "}
            <a
              href=""
              className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
              target="_blank"
            >
              Delegation Center
            </a>{" "}
            at any time before the mint.
          </p>
        </div>
        <p className="tw-mt-10 tw-pt-10 tw-border-t tw-border-solid tw-border-x-0 tw-border-b tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal">
          <div className="tw-max-w-5xl">
            <span className="tw-text-iron-300">Note:</span> The Your Mint tab
            will later be made available for Memes frops too, but is is not
            active yet. For now, please continue to use the Distribution Plan
            page for each card (example:{" "}
            <a
              href="https://seize.io/the-memes/192/distribution"
              className="tw-group tw-inline-flex tw-items-center tw-text-iron-200 hover:tw-text-primary-300 tw-font-medium tw-text-sm tw-duration-300 tw-transition tw-ease-out"
            >
              www.seize.io/the-memes/192/distribution
            </a>
            )
          </div>
        </p>
      </div>
    </div>
  );
}
