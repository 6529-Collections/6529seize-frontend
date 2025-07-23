"use client";

import React, { useState } from "react";

import { CommunityMemberMinimal } from "../../../entities/IProfile";
import GroupCreateIdentitiesSelect from "../../groups/page/create/config/identities/select/GroupCreateIdentitiesSelect";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { useAuth } from "../../auth/Auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { createDirectMessageWave } from "../../../helpers/waves/waves.helpers";
import { useRouter } from "next/navigation";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CreateWaveFlow from "../create-wave/CreateWaveFlow";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
export default function CreateDirectMessage({
  profile,
  onBack,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const { setToast } = useAuth();

  const [selectedIdentities, setSelectedIdentities] = useState<
    CommunityMemberMinimal[]
  >([]);

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    if (
      areEqualAddresses(
        identity.primary_wallet ?? identity.wallet,
        profile?.primary_wallet
      )
    ) {
      setToast({
        message: "You are included by default in a Direct Message!",
        type: "info",
      });
      return;
    }
    setSelectedIdentities([...selectedIdentities, identity]);
  };

  const onRemove = (id: string) => {
    if (areEqualAddresses(id, profile?.primary_wallet)) {
      setToast({
        message: "You cannot remove yourself from the DM",
        type: "error",
      });
      return;
    }

    setSelectedIdentities(
      selectedIdentities.filter(
        (i) => !areEqualAddresses(i.primary_wallet ?? i.wallet, id)
      )
    );
  };

  const onCreateDirectMessage = async () => {
    setIsCreating(true);
    try {
      const wave = await createDirectMessageWave({
        addresses: selectedIdentities
          .map((i) => i.primary_wallet ?? i.wallet)
          .filter((i) => i !== null),
      });
      router.push(`/my-stream?view=messages&wave=${wave.id}`);
    } catch (error) {
      console.error(error);
      setToast({
        message: `Failed to create Direct Message: ${error}`,
        type: "error",
      });
      setIsCreating(false);
    }
  };

  return (
    <CreateWaveFlow onBack={onBack} title="Create Direct Message">
      <div className="tw-mt-4 tw-text-sm tw-text-iron-400">
        <GroupCreateIdentitiesSelect
          onIdentitySelect={onIdentitySelect}
          selectedIdentities={selectedIdentities}
          selectedWallets={[]}
          onRemove={onRemove}
        />
      </div>
      <div className="tw-mt-4 tw-flex tw-justify-end">
        <button
          disabled={selectedIdentities.length === 0 || isCreating}
          onClick={onCreateDirectMessage}
          type="button"
          className="tw-flex tw-gap-x-2 tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm tw-transition tw-duration-300 tw-ease-out
    tw-border tw-border-solid 
    tw-bg-primary-500 tw-text-white tw-border-primary-500 
    hover:tw-bg-primary-600 hover:tw-border-primary-600
    focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600
    disabled:tw-bg-gray-300 disabled:tw-text-gray-500 disabled:tw-border-gray-300 disabled:hover:tw-bg-gray-300 disabled:tw-cursor-not-allowed">
          {isCreating ? (
            <CircleLoader size={CircleLoaderSize.MEDIUM} />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} className="tw-h-5 tw-w-5" />
          )}
          <span className="tw-text-lg">
            {isCreating ? "Creating..." : "Create"}
          </span>
        </button>
      </div>
    </CreateWaveFlow>
  );
}
