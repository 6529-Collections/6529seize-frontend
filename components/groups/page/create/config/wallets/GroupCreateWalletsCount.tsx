import GroupCreateWalletsCountText from "./GroupCreateWalletsCountText";

export default function GroupCreateWalletsCount({
  walletsCount,
  loading,
  removeWallets,
}: {
  readonly walletsCount: number | null;
  readonly loading: boolean;
  readonly removeWallets: () => void;
}) {
  const haveWallets = walletsCount !== null;
  return (
    <div className="tw-mt-4">
      <div className="tw-flex tw-gap-x-4 tw-items-center">
        <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm">
          <svg
            className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 7.99983V4.50048C16 3.66874 16 3.25287 15.8248 2.9973C15.6717 2.77401 15.4346 2.62232 15.1678 2.57691C14.8623 2.52493 14.4847 2.6992 13.7295 3.04775L4.85901 7.14182C4.18551 7.45267 3.84875 7.6081 3.60211 7.84915C3.38406 8.06225 3.21762 8.32238 3.1155 8.60966C3 8.93462 3 9.30551 3 10.0473V14.9998M16.5 14.4998H16.51M3 11.1998L3 17.7998C3 18.9199 3 19.48 3.21799 19.9078C3.40973 20.2841 3.71569 20.5901 4.09202 20.7818C4.51984 20.9998 5.07989 20.9998 6.2 20.9998H17.8C18.9201 20.9998 19.4802 20.9998 19.908 20.7818C20.2843 20.5901 20.5903 20.2841 20.782 19.9078C21 19.48 21 18.9199 21 17.7998V11.1998C21 10.0797 21 9.51967 20.782 9.09185C20.5903 8.71552 20.2843 8.40956 19.908 8.21782C19.4802 7.99983 18.9201 7.99983 17.8 7.99983L6.2 7.99983C5.0799 7.99983 4.51984 7.99983 4.09202 8.21781C3.7157 8.40956 3.40973 8.71552 3.21799 9.09185C3 9.51967 3 10.0797 3 11.1998ZM17 14.4998C17 14.776 16.7761 14.9998 16.5 14.9998C16.2239 14.9998 16 14.776 16 14.4998C16 14.2237 16.2239 13.9998 16.5 13.9998C16.7761 13.9998 17 14.2237 17 14.4998Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="tw-inline-flex tw-gap-x-1.5">
            <span className="tw-text-iron-400 tw-font-medium">Wallets:</span>
            <GroupCreateWalletsCountText
              loading={loading}
              walletsCount={walletsCount}
            />
          </span>
        </div>
        {haveWallets && (
          <button
            onClick={removeWallets}
            type="button"
            aria-label="Remove wallets"
            className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-650 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-ou"
          >
            <svg
              className="tw-h-4 tw-w-4 tw-text-error tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
        )}
      </div>
    </div>
  );
}
