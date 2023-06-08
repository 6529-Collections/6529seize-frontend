import { AllowlistToolBuilderOperationMeta } from "./AllowlistToolBuilderOperationsList";

export default function AllowlistToolBuilderOperationsListitem({
  operation,
}: {
  operation: AllowlistToolBuilderOperationMeta;
}) {
  if (operation.run) {
    return (
      <li className="tw-p-5 tw-rounded-lg tw-bg-neutral-800/50">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              className="tw-text-success"
              width="24"
              height="24"
              rx="12"
              fill="currentColor"
            />
            <path
              className="tw-text-white"
              d="M7.5 12L10.5 15L16.5 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-w-72 tw-text-sm tw-leading-5 tw-truncate tw-text-neutral-400">
            <span className="tw-text-sm tw-font-medium tw-text-neutral-400">
              {operation.title}
            </span>
          </div>
        </div>
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-y-2.5">
          {operation.params.map((param, i) => (
            <div
              className="tw-flex tw-gap-x-1"
              key={`operation-param-run-${i}`}
            >
              <div className="tw-w-20 tw-text-xs tw-leading-3">
                <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-400">
                  {param.title}
                </span>
              </div>
              <div className="tw-text-xs tw-leading-3 max-w-[10rem] tw-truncate tw-text-neutral-500">
                <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-500">
                  {param.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </li>
    );
  } else {
    return (
      <li className="tw-p-5 tw-rounded-lg tw-bg-neutral-800/50">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              className="tw-text-neutral-700"
              width="24"
              height="24"
              rx="12"
              fill="currentColor"
            />
            <path
              className="tw-text-neutral-500"
              d="M7.5 12L10.5 15L16.5 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-w-72 tw-text-sm tw-leading-5 tw-truncate tw-text-white">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-white">
              {operation.title}
            </span>
          </div>
        </div>
        <div className="tw-mt-3 tw-flex tw-flex-col gap-y-2.5">
          {operation.params.map((param, i) => (
            <div
              className="tw-flex tw-gap-x-1"
              key={`operation-param-not-run-${i}`}
            >
              <div className="tw-w-20 tw-leading-3 tw-text-xs">
                <span className="tw-whitespace-nowrap tw-text-xs tw-leading-3 tw-font-medium tw-text-neutral-200">
                  {param.title}
                </span>
              </div>
              <div className="tw-leading-3 tw-text-xs max-w-[10rem] tw-truncate tw-text-neutral-300">
                <span className="tw-text-xs tw-leading-3 tw-font-normal tw-text-neutral-300">
                  {param.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </li>
    );
  }
}
