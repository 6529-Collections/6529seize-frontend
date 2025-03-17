import { useContext, useEffect, useState } from "react";
import UserPageSetUpProfileHeader from "./UserPageSetUpProfileHeader";

import { useRouter } from "next/router";
import { useMutation } from "@tanstack/react-query";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
  PROFILE_CLASSIFICATION,
} from "../../../../entities/IProfile";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiPost } from "../../../../services/api/common-api";
import UserSettingsUsername from "../../settings/UserSettingsUsername";
import UserSettingsClassification from "../../settings/UserSettingsClassification";
import UserSettingsPrimaryWallet from "../../settings/UserSettingsPrimaryWallet";
import UserSettingsSave from "../../settings/UserSettingsSave";

export default function UserPageSetUpProfile({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);
  const router = useRouter();

  const [userName, setUserName] = useState<string>(
    profile.profile?.handle ?? ""
  );

  const [classification, setClassification] = useState<PROFILE_CLASSIFICATION>(
    profile.profile?.classification ?? PROFILE_CLASSIFICATION.PSEUDONYM
  );

  const getHighestTdhWalletOrNone = () => {
    const tdhWallets = profile.consolidation.wallets.toSorted(
      (a, b) => (b.tdh ?? 0) - (a.tdh ?? 0)
    );
    return tdhWallets.length > 0 ? tdhWallets[0].wallet.address : "";
  };

  const [primaryWallet, setPrimaryWallet] = useState<string>(
    profile.profile?.primary_wallet ?? getHighestTdhWalletOrNone()
  );

  const haveConsolidations = profile.consolidation.wallets.length > 1;

  const [haveChanges, setHaveChanges] = useState<boolean>(false);
  useEffect(() => {
    setHaveChanges(
      userName?.toLowerCase() !== profile.profile?.handle.toLowerCase() ||
        primaryWallet !== profile.profile?.primary_wallet ||
        classification !== profile.profile?.classification
    );
  }, [profile, userName, primaryWallet, classification]);

  const [mutating, setMutating] = useState<boolean>(false);

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
      setMutating(true);
      return await commonApiPost<
        ApiCreateOrUpdateProfileRequest,
        IProfileAndConsolidations
      >({
        endpoint: `profiles`,
        body,
      });
    },
    onSuccess: async (updatedProfile) => {
      setToast({
        message: "Profile updated.",
        type: "success",
      });

      const newPath = router.pathname.replace(
        "[user]",
        updatedProfile.profile?.handle!?.toLowerCase()
      );
      await router.replace(newPath);
      onProfileEdit({
        profile: updatedProfile,
        previousProfile: null,
      });
    },
    onError: (error: unknown) => {
      setToast({
        message: error as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in to save settings",
        type: "error",
      });
      return;
    }
    const body: ApiCreateOrUpdateProfileRequest = {
      handle: userName,
      classification,
    };

    if (profile.profile?.pfp_url) {
      body.pfp_url = profile.profile?.pfp_url;
    }

    await updateUser.mutateAsync(body);
  };

  const [userNameAvailable, setUserNameAvailable] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  return (
    <div className="tailwind-scope">
      <UserPageSetUpProfileHeader />
      <div className="lg:tw-max-w-lg tw-pt-6">
        <form onSubmit={onSubmit} className="tw-flex tw-flex-col">
          <UserSettingsUsername
            userName={userName}
            originalUsername={profile.profile?.handle ?? ""}
            setUserName={setUserName}
            setIsAvailable={setUserNameAvailable}
            setIsLoading={setCheckingUsername}
          />

          <UserSettingsClassification
            selected={classification}
            onSelect={setClassification}
          />

          {haveConsolidations && (
            <UserSettingsPrimaryWallet
              consolidations={profile.consolidation.wallets}
              selected={primaryWallet}
              onSelect={setPrimaryWallet}
            />
          )}

          <div className="tw-mt-7">
            <UserSettingsSave
              loading={mutating}
              disabled={!haveChanges || !userNameAvailable || checkingUsername}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
