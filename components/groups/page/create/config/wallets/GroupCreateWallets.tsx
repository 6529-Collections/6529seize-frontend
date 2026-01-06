"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTrash,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { dedupeWallets, walletListsMatch } from "@/helpers/WalletHelpers";
import { AuthContext } from "@/components/auth/Auth";
import GroupCreateIdentitiesSelect from "../identities/select/GroupCreateIdentitiesSelect";
import CreateGroupWalletsEmma from "./CreateGroupWalletsEmma";
import CreateGroupWalletsUpload from "./CreateGroupWalletsUpload";
import { useContext, useEffect, useRef, useState } from "react";

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
  const primaryWallet = connectedProfile?.primary_wallet;
  const LABELS: Record<GroupCreateWalletsType, string> = {
    [GroupCreateWalletsType.INCLUDE]: "Include Identities",
    [GroupCreateWalletsType.EXCLUDE]: "Exclude Identities",
  };

  const [uploadedWallets, setUploadedWallets] = useState<string[] | null>(
    wallets
  );
  const uploadedWalletsRef = useRef(uploadedWallets);
  const [emmaWallets, setEmmaWallets] = useState<string[] | null>(null);

  const [selectedIdentities, setSelectedIdentities] = useState<
    CommunityMemberMinimal[]
  >([]);

  const getSelectedWallets = () =>
    selectedIdentities.map((i) => i.wallet ?? i.primary_wallet);
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    getSelectedWallets()
  );
  const walletsRef = useRef(wallets);

  useEffect(() => {
    uploadedWalletsRef.current = uploadedWallets;
  }, [uploadedWallets]);

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  useEffect(() => {
    if (!wallets?.length) {
      setUploadedWallets(null);
      return;
    }
    const dedupedWallets = dedupeWallets(wallets);
    if (walletListsMatch(dedupedWallets, uploadedWalletsRef.current)) {
      return;
    }
    setUploadedWallets(dedupedWallets);
  }, [wallets]);

  useEffect(
    () => setSelectedWallets(getSelectedWallets()),
    [selectedIdentities]
  );

  useEffect(() => {
    if (type === GroupCreateWalletsType.EXCLUDE || iAmIncluded) {
      return;
    }
    const myWallets =
      connectedProfile?.wallets
        ?.map((w) => w.wallet?.toLowerCase())
        ?.filter(Boolean) ?? [];
    setSelectedIdentities((prev) =>
      prev.filter((i) => {
        const key = (i.wallet ?? i.primary_wallet)?.toLowerCase();
        return !key || !myWallets.includes(key);
      })
    );
  }, [iAmIncluded, connectedProfile, type]);

  const toKey = (i: CommunityMemberMinimal) =>
    (i.wallet ?? i.primary_wallet)?.toLowerCase();

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    setSelectedIdentities((prev) => {
      const target = toKey(identity);
      if (!target) return prev;
      if (prev.some((i) => toKey(i) === target)) {
        return prev.filter((i) => toKey(i) !== target);
      }
      return [...prev, identity];
    });
  };

  const onUploadedWalletsChange = (newV: string[] | null) =>
    setUploadedWallets(newV ? dedupeWallets(newV) : null);

  const onEmmaWalletsChange = (newV: string[] | null) =>
    setEmmaWallets(newV ? dedupeWallets(newV) : null);

  useEffect(() => {
    const uploaded = uploadedWallets ?? [];
    const emma = emmaWallets ?? [];
    const selected = selectedWallets ?? [];
    const combined = [...uploaded, ...emma, ...selected];
    if (
      iAmIncluded &&
      primaryWallet &&
      type === GroupCreateWalletsType.INCLUDE
    ) {
      combined.push(primaryWallet);
    }
    const dedupedAll = combined.length ? dedupeWallets(combined) : [];
    const next = dedupedAll.length ? dedupedAll : null;
    if (!walletListsMatch(next, walletsRef.current)) {
      setWallets(next);
    }
  }, [
    uploadedWallets,
    emmaWallets,
    selectedWallets,
    iAmIncluded,
    primaryWallet,
    type,
    setWallets,
  ]);

  const removeWallets = () => {
    setUploadedWallets(null);
    setEmmaWallets(null);
    setSelectedIdentities([]);
  };

  const onRemove = (wallet: string) => {
    const target = wallet.toLowerCase();
    setSelectedIdentities((prev) =>
      prev.filter(
        (i) => ((i.wallet ?? i.primary_wallet)?.toLowerCase() ?? "") !== target
      )
    );
  };

  const isOverLimit = (wallets?.length ?? 0) > walletsLimit;

  return (
    <div className="tw-col-span-full">
      <div className="tw-inline-flex tw-items-center tw-space-x-3 sm:tw-space-x-4">
        <span className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-size-10 sm:tw-size-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-700">
          <FontAwesomeIcon
            icon={faWallet}
            aria-hidden="true"
            className="tw-flex-shrink-0 tw-text-iron-50 tw-size-5 sm:tw-size-6"
          />
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
              } tw-bg-iron-950 tw-border tw-border-solid`}>
              <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm">
                <FontAwesomeIcon
                  icon={faWallet}
                  aria-hidden="true"
                  className="tw-size-6 tw-flex-shrink-0 tw-text-iron-300"
                />
                <span className="tw-inline-flex tw-gap-x-1.5">
                  <span className="tw-text-iron-50 tw-font-medium">
                    Total unique wallets:
                  </span>
                  <span
                    className={`tw-font-semibold ${
                      isOverLimit ? "tw-text-error" : "tw-text-primary-400"
                    }`}>
                    {formatNumberWithCommas(wallets.length)}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={removeWallets}
              type="button"
              aria-label="Remove wallets"
              className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-900 tw-ring-iron-700 hover:tw-ring-iron-650 tw-transition tw-duration-300 tw-ease-out">
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
        <div className="tw-pt-2 tw-text-error tw-text-xs tw-font-medium">
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
