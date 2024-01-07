import { useContext, useEffect, useState } from "react";
import UserPageSetUpProfileHeader from "./UserPageSetUpProfileHeader";
import UserSettingsUsername from "../../../settings/UserSettingsUsername";
import {
  ApiCreateOrUpdateProfileRequest,
  IProfileAndConsolidations,
  PROFILE_CLASSIFICATION,
} from "../../../../../entities/IProfile";
import UserSettingsClassification from "../../../settings/UserSettingsClassification";
import UserSettingsPrimaryWallet from "../../../settings/UserSettingsPrimaryWallet";
import UserSettingsSave from "../../../settings/UserSettingsSave";
import { AuthContext } from "../../../../auth/Auth";
import { commonApiPost } from "../../../../../services/api/common-api";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { useRouter } from "next/router";
import { useMutation } from "@tanstack/react-query";

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
      primary_wallet: primaryWallet,
      classification,
    };

    await updateUser.mutateAsync(body);
  };

  const [userNameAvailable, setIsUserNameAvailable] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  return (
    <div className="tailwind-scope">
      <UserPageSetUpProfileHeader />
      <div className="tw-pt-10 tw-space-y-6 tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700">
        <div className="tw-flex tw-flex-col tw-gap-y-6">
          <div className="tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-p-6 lg:tw-p-8 tw-rounded-lg">
            <form
              onSubmit={onSubmit}
              className="tw-flex tw-flex-col tw-gap-y-6"
            >
              <UserSettingsUsername
                userName={userName}
                originalUsername={profile.profile?.handle ?? ""}
                setUserName={setUserName}
                setIsAvailable={setIsUserNameAvailable}
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

              <UserSettingsSave
                loading={mutating}
                disabled={
                  !haveChanges || !userNameAvailable || checkingUsername
                }
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
