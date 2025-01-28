import Tippy from "@tippyjs/react";
import { formatLargeNumber } from "../../../../../../../helpers/Helpers";
import { CreateWaveOutcomeConfig } from "../../../../../../../types/waves.types";

export default function CreateWaveOutcomesRowRepApprove({
  outcome,
  removeOutcome,
}: {
  readonly outcome: CreateWaveOutcomeConfig;
  readonly removeOutcome: () => void;
}) {
  const winnersText = outcome.maxWinners
    ? `${formatLargeNumber(outcome.maxWinners)}`
    : "-";
  return (
    <div className="tw-bg-gradient-to-r tw-from-primary-400/[0.15] tw-to-primary-400/[0.05] tw-rounded-lg tw-ring-1 tw-ring-inset tw-ring-primary-400/10 tw-px-5 tw-py-2 tw-grid tw-grid-cols-10 tw-gap-x-6 tw-justify-between tw-items-center tw-w-full">
      <div className="tw-col-span-1">
        <h3 className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-white">
          Rep
        </h3>
      </div>
      <div className="tw-col-span-3">
        <Tippy content={outcome.category}>
          <p className="tw-mb-0 tw-text-sm tw-text-white tw-font-normal tw-truncate">
            {outcome.category}
          </p>
        </Tippy>
      </div>
      <div className="tw-col-span-2">
        <p className="tw-mb-0 tw-text-sm tw-text-white tw-font-normal tw-text-nowrap">
          {formatLargeNumber(outcome.credit ?? 0)} Rep
        </p>
      </div>
      <div className="tw-col-span-3">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <svg
            className="tw-size-5 tw-text-primary-400 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.86866 15.4599L7 22L11.5884 19.247C11.7381 19.1572 11.8129 19.1123 11.8928 19.0947C11.9634 19.0792 12.0366 19.0792 12.1072 19.0947C12.1871 19.1123 12.2619 19.1572 12.4116 19.247L17 22L16.1319 15.4571M16.4259 4.24888C16.5803 4.6224 16.8768 4.9193 17.25 5.0743L18.5589 5.61648C18.9325 5.77121 19.2292 6.06799 19.384 6.44154C19.5387 6.81509 19.5387 7.23481 19.384 7.60836L18.8422 8.91635C18.6874 9.29007 18.6872 9.71021 18.8427 10.0837L19.3835 11.3913C19.4602 11.5764 19.4997 11.7747 19.4997 11.975C19.4998 12.1752 19.4603 12.3736 19.3837 12.5586C19.3071 12.7436 19.1947 12.9118 19.0531 13.0534C18.9114 13.195 18.7433 13.3073 18.5582 13.3839L17.2503 13.9256C16.8768 14.0801 16.5799 14.3765 16.4249 14.7498L15.8827 16.0588C15.728 16.4323 15.4312 16.7291 15.0577 16.8838C14.6841 17.0386 14.2644 17.0386 13.8909 16.8838L12.583 16.342C12.2094 16.1877 11.7899 16.188 11.4166 16.3429L10.1077 16.8843C9.73434 17.0387 9.31501 17.0386 8.94178 16.884C8.56854 16.7293 8.27194 16.4329 8.11711 16.0598L7.57479 14.7504C7.42035 14.3769 7.12391 14.08 6.75064 13.925L5.44175 13.3828C5.06838 13.2282 4.77169 12.9316 4.61691 12.5582C4.46213 12.1849 4.46192 11.7654 4.61633 11.3919L5.1581 10.0839C5.31244 9.71035 5.31213 9.29079 5.15722 8.91746L4.61623 7.60759C4.53953 7.42257 4.50003 7.22426 4.5 7.02397C4.49997 6.82369 4.5394 6.62536 4.61604 6.44032C4.69268 6.25529 4.80504 6.08716 4.94668 5.94556C5.08832 5.80396 5.25647 5.69166 5.44152 5.61508L6.74947 5.07329C7.12265 4.91898 7.41936 4.6229 7.57448 4.25004L8.11664 2.94111C8.27136 2.56756 8.56813 2.27078 8.94167 2.11605C9.3152 1.96132 9.7349 1.96132 10.1084 2.11605L11.4164 2.65784C11.7899 2.81218 12.2095 2.81187 12.5828 2.65696L13.8922 2.11689C14.2657 1.96224 14.6853 1.96228 15.0588 2.11697C15.4322 2.27167 15.729 2.56837 15.8837 2.94182L16.426 4.25115L16.4259 4.24888Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="tw-mb-0 tw-text-sm tw-text-primary-400 tw-font-medium">
            Max winners: {winnersText}
          </p>
        </div>
      </div>
      <div className="tw-col-span-1 tw-flex tw-justify-end">
        <button
          onClick={removeOutcome}
          aria-label="Remove"
          className="tw-h-8 tw-w-8 tw-text-error tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-error/10 focus:tw-scale-90 tw-transform tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
