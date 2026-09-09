"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import GroupCreateIdentitiesSelect from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import CreateWaveFlow from "../create-wave/CreateWaveFlow";
export default function CreateDirectMessage({
  profile,
  onBack,
  onSuccess,
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const locale = useBrowserLocale();
  const router = useRouter();
  const { isApp } = useDeviceInfo();

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
        message: "You are already included in this direct message.",
        type: "info",
      });
      return;
    }
    setSelectedIdentities([...selectedIdentities, identity]);
  };

  const onRemove = (id: string) => {
    if (areEqualAddresses(id, profile?.primary_wallet)) {
      setToast({
        message: "You can't remove yourself from this direct message.",
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
      onSuccess?.();
      navigateToDirectMessage({ waveId: wave.id, router, isApp });
    } catch (error) {
      console.error(error);
      const errorMessage = getToastErrorDetails(error);
      setToast({
        type: "error",
        title: "Couldn't create this direct message.",
        description:
          errorMessage ?? t(locale, "profilePreferences.dm.createRetry"),
      });
      setIsCreating(false);
    }
  };

  return (
    <CreateWaveFlow onBack={onBack} title="Create Direct Message">
      <div className="tw-text-sm tw-text-iron-400">
        <GroupCreateIdentitiesSelect
          onIdentitySelect={onIdentitySelect}
          selectedIdentities={selectedIdentities}
          selectedWallets={[]}
          onRemove={onRemove}
          appearance="modal"
          resultsLayout="inline"
          sort="level"
        />
        <div className="tw-mt-3 tw-flex tw-justify-end">
          <Button
            disabled={selectedIdentities.length === 0 || isCreating}
            onClick={onCreateDirectMessage}
            loading={isCreating}
            variant="action"
            size="md"
          >
            {!isCreating && (
              <FontAwesomeIcon
                icon={faPaperPlane}
                className="-tw-ml-0.5 tw-size-3 tw-flex-shrink-0"
              />
            )}
            <span>{isCreating ? "Creating..." : "Create"}</span>
          </Button>
        </div>
      </div>
    </CreateWaveFlow>
  );
}
