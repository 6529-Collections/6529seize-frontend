import { CustomTokenPoolParamsToken } from "@/components/allowlist-tool/allowlist-tool.types";

export default function CreateCustomSnapshotFormTableItem({
  token,
  index,
  onRemoveToken,
}: {
  readonly token: CustomTokenPoolParamsToken;
  readonly index: number;
  readonly onRemoveToken: (index: number) => void;
}) {
  return (
    <tr>
      <td className="tw-w-8 tw-whitespace-nowrap tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-sm tw-font-light tw-text-neutral-400 sm:pl-6">
        {index + 1}
      </td>
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-pl-3 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-50 sm:pl-6">
        {token.owner}
      </td>
      <td className="tw-whitespace-nowrap tw-py-3.5 tw-pl-3 tw-pr-4 tw-text-right tw-text-sm tw-font-medium sm:tw-pr-6">
        <button
          type="button"
          title="Delete"
          onClick={() => onRemoveToken(index)}
          className="tw-rounded-full tw-group tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
        >
          <svg
            className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </td>
    </tr>
  );
}
