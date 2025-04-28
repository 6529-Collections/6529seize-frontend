import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { AuthContext } from "../../../../../auth/Auth";
import GroupCreateIdentitiesSelect from "../identities/select/GroupCreateIdentitiesSelect";
import CreateGroupWalletsEmma from "./CreateGroupWalletsEmma";
import CreateGroupWalletsUpload from "./CreateGroupWalletsUpload";
import { useContext, useEffect, useState } from "react";

export enum GroupCreateWalletsType {
  INCLUDE = "INCLUDE",
  EXCLUDE = "EXCLUDE",
}

export default function GroupCreateWallets({
  type,
  wallets,
  walletsLimit,
  iAmIncluded,
  setWallets,
}: {
  readonly type: GroupCreateWalletsType;
  readonly wallets: string[] | null;
  readonly walletsLimit: number;
  readonly iAmIncluded: boolean;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const LABELS: Record<GroupCreateWalletsType, string> = {
    [GroupCreateWalletsType.INCLUDE]: "Include Identities",
    [GroupCreateWalletsType.EXCLUDE]: "Exclude Identities",
  };

  const [uploadedWallets, setUploadedWallets] = useState<string[] | null>(
    wallets
  );
  const [emmaWallets, setEmmaWallets] = useState<string[] | null>(null);

  const [selectedIdentities, setSelectedIdentities] = useState<
    CommunityMemberMinimal[]
  >([]);

  const getSelectedWallets = () =>
    selectedIdentities.map((i) => i.wallet ?? i.primary_wallet);
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    getSelectedWallets()
  );

  useEffect(
    () => setSelectedWallets(getSelectedWallets()),
    [selectedIdentities]
  );

  useEffect(() => {
    if (type === GroupCreateWalletsType.EXCLUDE || iAmIncluded) {
      return;
    }
    const myWallets =
      connectedProfile?.wallets?.map((w) => w.wallet.toLowerCase()) ?? [];
    setSelectedIdentities((prev) =>
      prev.filter((i) => !myWallets.includes(i.wallet.toLowerCase()))
    );
  }, [iAmIncluded, connectedProfile]);

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    setSelectedIdentities((prev) => {
      if (prev.some((i) => i.wallet === identity.wallet)) {
        return prev.filter((i) => i.wallet !== identity.wallet);
      }
      return [...prev, identity];
    });
  };

  const onUploadedWalletsChange = (newV: string[] | null) =>
    setUploadedWallets(newV ? Array.from(new Set(newV)) : null);

  const onEmmaWalletsChange = (newV: string[] | null) =>
    setEmmaWallets(newV ? Array.from(new Set(newV)) : null);

  useEffect(() => {
    const uploaded = uploadedWallets ?? [];
    const emma = emmaWallets ?? [];
    const selected = selectedWallets ?? [];
    const all = Array.from(new Set([...uploaded, ...emma, ...selected]));
    if (
      iAmIncluded &&
      connectedProfile?.primary_wallet &&
      type === GroupCreateWalletsType.INCLUDE
    ) {
      all.push(connectedProfile.primary_wallet);
    }
    setWallets(all.length ? Array.from(new Set(all)) : null);
  }, [uploadedWallets, emmaWallets, selectedWallets]);

  const removeWallets = () => {
    setUploadedWallets(null);
    setEmmaWallets(null);
    setSelectedIdentities([]);
  };

  const onRemove = (wallet: string) => {
    setSelectedIdentities((prev) => prev.filter((i) => i.wallet !== wallet));
  };

  const isOverLimit = wallets?.length && wallets.length > walletsLimit;

  return (
    <div className="tw-col-span-full">
      <div className="tw-inline-flex tw-items-center tw-space-x-3 sm:tw-space-x-4">
        <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-size-10 sm:tw-size-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
          <svg
            className="tw-flex-shrink-0 tw-text-iron-50 tw-size-5 sm:tw-size-6"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 8.5H2M2 12.5H5.54668C6.08687 12.5 6.35696 12.5 6.61813 12.5466C6.84995 12.5879 7.0761 12.6563 7.29191 12.7506C7.53504 12.8567 7.75977 13.0065 8.20924 13.3062L8.79076 13.6938C9.24023 13.9935 9.46496 14.1433 9.70809 14.2494C9.9239 14.3437 10.15 14.4121 10.3819 14.4534C10.643 14.5 10.9131 14.5 11.4533 14.5H12.5467C13.0869 14.5 13.357 14.5 13.6181 14.4534C13.85 14.4121 14.0761 14.3437 14.2919 14.2494C14.535 14.1433 14.7598 13.9935 15.2092 13.6938L15.7908 13.3062C16.2402 13.0065 16.465 12.8567 16.7081 12.7506C16.9239 12.6563 17.15 12.5879 17.3819 12.5466C17.643 12.5 17.9131 12.5 18.4533 12.5H22M2 7.2L2 16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L18.8 20C19.9201 20 20.4802 20 20.908 19.782C21.2843 19.5903 21.5903 19.2843 21.782 18.908C22 18.4802 22 17.9201 22 16.8V7.2C22 6.0799 22 5.51984 21.782 5.09202C21.5903 4.7157 21.2843 4.40974 20.908 4.21799C20.4802 4 19.9201 4 18.8 4L5.2 4C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.07989 2 7.2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="tw-mb-0 tw-text-xl sm:tw-text-2xl tw-font-semibold tw-text-iron-50">
          {LABELS[type]}
        </p>
      </div>
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 sm:tw-gap-6">
        <GroupCreateIdentitiesSelect
          onIdentitySelect={onIdentitySelect}
          selectedIdentities={selectedIdentities}
          selectedWallets={selectedWallets}
          onRemove={onRemove}
        />
        <CreateGroupWalletsEmma
          setWallets={onEmmaWalletsChange}
          wallets={emmaWallets}
        />
        <CreateGroupWalletsUpload
          type={type}
          setWallets={onUploadedWalletsChange}
          wallets={uploadedWallets}
        />
      </div>
      {!!wallets?.length && (
        <div className="tw-mt-4 tw-w-full md:tw-w-1/2 sm:tw-pr-4">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-x-4">
            <div
              className={`tw-w-full tw-px-4 tw-py-3 tw-flex tw-justify-between tw-gap-x-4 tw-items-center tw-rounded-xl ${
                isOverLimit ? " tw-border-error" : " tw-border-iron-400"
              } tw-bg-iron-950 tw-border tw-border-solid`}
            >
              <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm">
                <svg
                  className="tw-size-6 tw-flex-shrink-0 tw-text-iron-300"
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
                  <span className="tw-text-iron-50 tw-font-medium">
                    Total unique wallets:
                  </span>
                  <span
                    className={`tw-font-semibold ${
                      isOverLimit ? "tw-text-error" : "tw-text-primary-400"
                    }`}
                  >
                    {formatNumberWithCommas(wallets.length)}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={removeWallets}
              type="button"
              aria-label="Remove wallets"
              className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-900 tw-ring-iron-700 hover:tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out"
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
          </div>
        </div>
      )}
      {isOverLimit && (
        <div className="tw-pt-2 tw-text-error tw-text-xs tw-font-medium">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-error"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              Maximum allowed wallets count is{" "}
              {formatNumberWithCommas(walletsLimit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
