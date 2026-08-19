"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTrash,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { dedupeWallets } from "@/helpers/WalletHelpers";
import { AuthContext } from "@/components/auth/Auth";
import GroupCreateIdentitiesSelect from "../identities/select/GroupCreateIdentitiesSelect";
import CreateGroupWalletsEmma from "./CreateGroupWalletsEmma";
import CreateGroupWalletsUpload from "./CreateGroupWalletsUpload";
import GroupCreateSectionHeader from "../../GroupCreateSectionHeader";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

export enum GroupCreateWalletsType {
  INCLUDE = "INCLUDE",
  EXCLUDE = "EXCLUDE",
}

export interface GroupCreateWalletSources {
  readonly uploadedWallets: string[] | null;
  readonly emmaWallets: string[] | null;
  readonly selectedIdentities: CommunityMemberMinimal[];
}

export default function GroupCreateWallets({
  type,
  wallets,
  walletsLimit,
  iAmIncluded,
  sources,
  setSources,
  setWallets,
}: {
  readonly type: GroupCreateWalletsType;
  readonly wallets: string[] | null;
  readonly walletsLimit: number;
  readonly iAmIncluded: boolean;
  readonly sources: GroupCreateWalletSources;
  readonly setSources: Dispatch<SetStateAction<GroupCreateWalletSources>>;
  readonly setWallets: (wallets: string[] | null) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const primaryWallet = connectedProfile?.primary_wallet;
  const LABELS: Record<GroupCreateWalletsType, string> = {
    [GroupCreateWalletsType.INCLUDE]: "Include Identities",
    [GroupCreateWalletsType.EXCLUDE]: "Exclude Identities",
  };

  const selectedWallets = useMemo(
    () => sources.selectedIdentities.map((identity) => identity.wallet),
    [sources.selectedIdentities]
  );
  const myWalletKeys = useMemo(
    () =>
      new Set(
        connectedProfile?.wallets?.map((wallet) =>
          wallet.wallet.toLowerCase()
        ) ?? []
      ),
    [connectedProfile?.wallets]
  );

  const toKey = (identity: CommunityMemberMinimal) =>
    identity.wallet.toLowerCase();

  const sourcesRef = useRef(sources);
  useEffect(() => {
    sourcesRef.current = sources;
  }, [sources]);

  const updateSources = (
    update: (previous: GroupCreateWalletSources) => GroupCreateWalletSources
  ) => {
    const nextSources = update(sourcesRef.current);
    sourcesRef.current = nextSources;
    const combined = [
      ...(nextSources.uploadedWallets ?? []),
      ...(nextSources.emmaWallets ?? []),
      ...nextSources.selectedIdentities.map((identity) => identity.wallet),
    ];
    const includesConnectedWallet = combined.some((wallet) =>
      myWalletKeys.has(wallet.toLowerCase())
    );
    if (
      primaryWallet &&
      type === GroupCreateWalletsType.INCLUDE &&
      (iAmIncluded || includesConnectedWallet)
    ) {
      combined.push(primaryWallet);
    }
    const nextWallets = dedupeWallets(combined);
    setSources(() => nextSources);
    setWallets(nextWallets.length ? nextWallets : null);
  };

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    updateSources((previous) => {
      const target = toKey(identity);
      const selectedIdentities = previous.selectedIdentities.some(
        (selectedIdentity) => toKey(selectedIdentity) === target
      )
        ? previous.selectedIdentities.filter(
            (selectedIdentity) => toKey(selectedIdentity) !== target
          )
        : [...previous.selectedIdentities, identity];
      return { ...previous, selectedIdentities };
    });
  };

  const onUploadedWalletsChange = (newWallets: string[] | null) =>
    updateSources((previous) => ({
      ...previous,
      uploadedWallets: newWallets ? dedupeWallets(newWallets) : null,
    }));

  const onEmmaWalletsChange = (newWallets: string[] | null) =>
    updateSources((previous) => ({
      ...previous,
      emmaWallets: newWallets ? dedupeWallets(newWallets) : null,
    }));

  const removeWallets = () =>
    updateSources(() => ({
      uploadedWallets: null,
      emmaWallets: null,
      selectedIdentities: [],
    }));

  const onRemove = (wallet: string) => {
    const target = wallet.toLowerCase();
    updateSources((previous) => ({
      ...previous,
      selectedIdentities: previous.selectedIdentities.filter(
        (identity) => identity.wallet.toLowerCase() !== target
      ),
    }));
  };

  const isOverLimit = (wallets?.length ?? 0) > walletsLimit;

  return (
    <div className="tw-col-span-full">
      <GroupCreateSectionHeader
        title={LABELS[type]}
        icon={
          <FontAwesomeIcon
            icon={faWallet}
            aria-hidden="true"
            className="tw-size-5 tw-flex-shrink-0 tw-text-iron-50"
          />
        }
      />
      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-gap-6 lg:tw-grid-cols-2">
        <GroupCreateIdentitiesSelect
          onIdentitySelect={onIdentitySelect}
          selectedIdentities={sources.selectedIdentities}
          selectedWallets={selectedWallets}
          onRemove={onRemove}
        />
        <CreateGroupWalletsEmma
          setWallets={onEmmaWalletsChange}
          wallets={sources.emmaWallets}
        />
        <CreateGroupWalletsUpload
          type={type}
          setWallets={onUploadedWalletsChange}
          wallets={sources.uploadedWallets}
        />
      </div>
      {!!wallets?.length && (
        <div className="tw-mt-4 tw-w-full sm:tw-pr-4 md:tw-w-1/2">
          <div className="tw-flex tw-w-full tw-items-center tw-gap-x-4">
            <div
              className={`tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4 tw-rounded-xl tw-px-4 tw-py-3 ${
                isOverLimit ? "tw-border-error" : "tw-border-iron-400"
              } tw-border tw-border-solid tw-bg-iron-950`}
            >
              <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm">
                <FontAwesomeIcon
                  icon={faWallet}
                  aria-hidden="true"
                  className="tw-size-6 tw-flex-shrink-0 tw-text-iron-300"
                />
                <span className="tw-inline-flex tw-gap-x-1.5">
                  <span className="tw-font-medium tw-text-iron-50">
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
              className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-iron-900 tw-p-2 tw-text-xs tw-font-medium tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-ring-iron-650"
            >
              <FontAwesomeIcon
                icon={faTrash}
                aria-hidden="true"
                className="tw-h-4 tw-w-4 tw-text-error tw-transition tw-duration-300 tw-ease-out"
              />
            </button>
          </div>
        </div>
      )}
      {isOverLimit && (
        <div className="tw-pt-2 tw-text-xs tw-font-medium tw-text-error">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <FontAwesomeIcon
              icon={faCircleExclamation}
              aria-hidden="true"
              className="tw-size-5 tw-flex-shrink-0 tw-text-error"
            />
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
