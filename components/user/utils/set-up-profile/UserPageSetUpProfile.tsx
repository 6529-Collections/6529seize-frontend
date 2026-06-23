"use client";

import { useContext, useState, type ReactNode } from "react";
import UserPageSetUpProfileHeader from "./UserPageSetUpProfileHeader";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { markIdentityGettingStartedSession } from "@/components/user/identity/getting-started/identityGettingStartedSession";
import UserSettingsClassification from "@/components/user/settings/UserSettingsClassification";
import UserSettingsPrimaryWallet from "@/components/user/settings/UserSettingsPrimaryWallet";
import UserSettingsSave from "@/components/user/settings/UserSettingsSave";
import UserSettingsUsername from "@/components/user/settings/UserSettingsUsername";
import type { ApiCreateOrUpdateProfileRequest } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

function FieldHelper({ children }: { readonly children: ReactNode }) {
  return (
    <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-500">
      {children}
    </p>
  );
}

const getInitialClassification = (
  profile: ApiIdentity
): ApiProfileClassification =>
  (
    profile as {
      readonly classification?: ApiProfileClassification | null | undefined;
    }
  ).classification ?? ApiProfileClassification.Pseudonym;

export default function UserPageSetUpProfile({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { onProfileEdit } = useContext(ReactQueryWrapperContext);
  const router = useRouter();
  const pathname = usePathname();

  const [userName, setUserName] = useState<string>(profile.handle ?? "");

  const [classification, setClassification] =
    useState<ApiProfileClassification>(getInitialClassification(profile));

  const getHighestTdhWalletOrNone = () => {
    const tdhWallets = (profile.wallets ?? []).toSorted(
      (a, b) => b.tdh - a.tdh
    );
    const topWallet = tdhWallets[0];
    return topWallet === undefined ? "" : topWallet.wallet;
  };

  const [primaryWallet, setPrimaryWallet] = useState<string>(
    profile.primary_wallet && profile.primary_wallet.length > 0
      ? profile.primary_wallet
      : getHighestTdhWalletOrNone()
  );

  const haveConsolidations = (profile.wallets?.length ?? 0) > 1;

  const haveChanges =
    userName.toLowerCase() !== (profile.handle ?? "").toLowerCase() ||
    primaryWallet !== profile.primary_wallet ||
    classification !== profile.classification;

  const [mutating, setMutating] = useState<boolean>(false);

  const updateUser = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) => {
      setMutating(true);
      return await commonApiPost<ApiCreateOrUpdateProfileRequest, ApiIdentity>({
        endpoint: `profiles`,
        body,
      });
    },
    onSuccess: (updatedProfile) => {
      if (!profile.handle?.trim() && updatedProfile.handle?.trim()) {
        markIdentityGettingStartedSession(updatedProfile.handle);
      }

      setToast({
        message: "Profile updated.",
        type: "success",
      });

      const newPath = (() => {
        const updatedHandle = (updatedProfile.handle ?? "").toLowerCase();
        const parts = pathname.split("/");
        if (parts.length > 1) {
          parts[1] = updatedHandle;
          return parts.join("/");
        }
        return `/${updatedHandle}`;
      })();
      router.replace(newPath, { scroll: false });
      onProfileEdit({
        profile: updatedProfile,
        previousProfile: null,
      });
    },
    onError: (error: unknown) => {
      setToast({
        type: "error",
        title: "Couldn't set up this profile.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
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
        message: "Log in to save settings.",
        type: "error",
      });
      return;
    }
    const body: ApiCreateOrUpdateProfileRequest = {
      handle: userName,
      classification,
    };

    if (profile.pfp) {
      body.pfp_url = profile.pfp;
    }

    await updateUser.mutateAsync(body);
  };

  const [userNameAvailable, setUserNameAvailable] = useState<boolean>(false);
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);

  return (
    <div className="tailwind-scope">
      <section className="tw-mx-auto tw-w-full tw-max-w-xl">
        <div className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-[#08090b] tw-p-5 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:tw-p-6 lg:tw-p-7">
          <UserPageSetUpProfileHeader />

          <form onSubmit={onSubmit} className="tw-mt-6 tw-flex tw-flex-col">
            <UserSettingsUsername
              userName={userName}
              originalUsername={profile.handle ?? ""}
              setUserName={setUserName}
              setIsAvailable={setUserNameAvailable}
              setIsLoading={setCheckingUsername}
            />

            <div className="tw-mt-6">
              <UserSettingsClassification
                selected={classification}
                onSelect={setClassification}
              />
              <FieldHelper>You can change this later.</FieldHelper>
            </div>

            {haveConsolidations && (
              <div className="tw-mt-6">
                <UserSettingsPrimaryWallet
                  wallets={profile.wallets ?? []}
                  selected={primaryWallet}
                  onSelect={setPrimaryWallet}
                />
                <FieldHelper>
                  This wallet is shown as your main profile wallet and can be
                  changed later.
                </FieldHelper>
              </div>
            )}

            <div className="tw-mt-7">
              <UserSettingsSave
                loading={mutating}
                disabled={
                  !haveChanges || !userNameAvailable || checkingUsername
                }
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
