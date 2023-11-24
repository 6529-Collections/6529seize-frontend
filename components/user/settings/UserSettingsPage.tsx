import { FormEvent, useContext, useEffect, useState } from "react";
import {
  IProfileAndConsolidations,
  PROFILE_CLASSIFICATION,
} from "../../../entities/IProfile";
import UserSettingsPrimaryWallet from "./UserSettingsPrimaryWallet";
import UserSettingsSave from "./UserSettingsSave";
import UserSettingsUsername from "./UserSettingsUsername";
import { AuthContext, IProfileWithMeta } from "../../auth/Auth";
import { useRouter } from "next/router";
import { commonApiPost } from "../../../services/api/common-api";
import UserSettingsImg from "./UserSettingsImg";
import UserSettingsBackground from "./UserSettingsBackground";
import { getRandomColor } from "../../../helpers/Helpers";
import UserSettingsWebsite from "./UserSettingsWebsite";
import UserSettingsClassification from "./UserSettingsClassification";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

interface ApiCreateOrUpdateProfileRequest {
  readonly handle: string;
  readonly primary_wallet: string;
  readonly classification: PROFILE_CLASSIFICATION;
  pfp_url?: string | undefined;
  banner_1?: string | undefined;
  banner_2?: string | undefined;
  website?: string | undefined;
}

export default function UserSettingsPage({
  user,
  onUser,
}: {
  user: IProfileWithMeta;
  onUser: (user: IProfileAndConsolidations) => void;
}) {
  const { requestAuth, setToast, updateMyProfile } = useContext(AuthContext);
  const router = useRouter();
  const [userName, setUserName] = useState<string>(user.profile?.handle ?? "");
  const account = useAccount();
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: async (body: ApiCreateOrUpdateProfileRequest) =>
      await commonApiPost<
        ApiCreateOrUpdateProfileRequest,
        IProfileAndConsolidations
      >({
        endpoint: "profiles",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", account.address],
      });
    },
  });

  const getHighestTdhWalletOrNone = () => {
    const tdhWallets = user.consolidation.wallets.sort(
      (a, b) => (b.tdh ?? 0) - (a.tdh ?? 0)
    );
    return tdhWallets.length > 0 ? tdhWallets[0].wallet.address : "";
  };

  const [classification, setClassification] = useState<PROFILE_CLASSIFICATION>(
    user.profile?.classification ?? PROFILE_CLASSIFICATION.GOVERNMENT_NAME
  );

  const [primaryWallet, setPrimaryWallet] = useState<string>(
    user.profile?.primary_wallet ?? getHighestTdhWalletOrNone()
  );

  const [bgColor1, setBgColor1] = useState<string>(
    user.profile?.banner_1 ?? getRandomColor()
  );
  const [bgColor2, setBgColor2] = useState<string>(
    user.profile?.banner_2 ?? getRandomColor()
  );

  const [website, setWebsite] = useState<string>(user.profile?.website ?? "");
  const [saving, setSaving] = useState<boolean>(false);

  const onSave = async () => {
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        message: "You must be logged in to save settings",
        type: "error",
      });
      router.push("/404");
      return;
    }

    const body: ApiCreateOrUpdateProfileRequest = {
      handle: userName,
      primary_wallet: primaryWallet,
      classification,
    };

    if (bgColor1) {
      body.banner_1 = bgColor1;
    }

    if (bgColor2) {
      body.banner_2 = bgColor2;
    }

    if (website) {
      body.website = website;
    }
    setSaving(true);
    try {
      // const response = await commonApiPost<
      //   ApiCreateOrUpdateProfileRequest,
      //   IProfileAndConsolidations
      // >({
      //   endpoint: "profiles",
      //   body,
      // });
      const response = await mutateAsync(body);
      if (response.profile?.handle !== user.profile?.handle) {
        router.push(`/${response.profile?.handle}/settings`);
      }
      onUser(response);
      await updateMyProfile();
      setToast({
        message: "Profile updated",
        type: "success",
      });
    } catch (e: any) {
      setToast({
        message: e?.message ?? "Something went wrong",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave();
  };

  const [haveChanges, setHaveChanges] = useState<boolean>(false);
  useEffect(() => {
    setHaveChanges(
      userName?.toLowerCase() !== user.profile?.handle.toLowerCase() ||
        primaryWallet !== user.profile?.primary_wallet ||
        classification !== user.profile?.classification ||
        bgColor1 !== user.profile?.banner_1 ||
        bgColor2 !== user.profile?.banner_2 ||
        website !== (user.profile?.website ?? "")
    );
  }, [
    user,
    userName,
    primaryWallet,
    bgColor1,
    bgColor2,
    website,
    classification,
  ]);

  return (
    <div className="tw-pt-10 tw-space-y-6 tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-neutral-700">
      <div className="tw-flex tw-flex-col tw-gap-y-6">
        <div className="tw-bg-neutral-800 tw-p-8 tw-rounded-lg">
          <form onSubmit={onSubmit} className="tw-flex tw-flex-col tw-gap-y-6">
            <UserSettingsUsername
              userName={userName}
              originalUsername={user.profile?.handle ?? ""}
              setUserName={setUserName}
            />

            <UserSettingsClassification
              selected={classification}
              onSelect={setClassification}
            />

            <UserSettingsPrimaryWallet
              consolidations={user.consolidation.wallets}
              selected={primaryWallet}
              onSelect={setPrimaryWallet}
            />
            <UserSettingsBackground
              bgColor1={bgColor1}
              bgColor2={bgColor2}
              setBgColor1={setBgColor1}
              setBgColor2={setBgColor2}
            />
            <UserSettingsWebsite website={website} setWebsite={setWebsite} />
            <UserSettingsSave loading={saving} disabled={!haveChanges} />
          </form>
        </div>
        {user.profile && <UserSettingsImg profile={user.profile} />}
      </div>
    </div>
  );
}
