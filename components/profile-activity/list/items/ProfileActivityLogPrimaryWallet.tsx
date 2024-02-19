import { ProfileActivityLogPrimaryWalletEdit } from "../../../../entities/IProfile";
import { formatAddress } from "../../../../helpers/Helpers";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import ProfileActivityLogItemValueWithCopy from "./utils/ProfileActivityLogItemValueWithCopy";

export default function ProfileActivityLogPrimaryWallet({
  log,
}: {
  readonly log: ProfileActivityLogPrimaryWalletEdit;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <>
      <ProfileActivityLogItemAction action={isAdded ? "added" : "changed"} />

      <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
        primary wallet
      </span>
      {!isAdded && (
        <>
          <ProfileActivityLogItemValueWithCopy
            title={formatAddress(log.contents.old_value)}
            value={log.contents.old_value}
          />
          <svg
            className="tw-h-5 tw-w-5 tw-text-iron-400"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12H20M20 12L14 6M20 12L14 18"
              stroke="currentcOLOR"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
      <ProfileActivityLogItemValueWithCopy
        title={formatAddress(log.contents.new_value)}
        value={log.contents.new_value}
      />
    </>
  );
}
