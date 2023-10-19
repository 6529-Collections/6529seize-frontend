import { useAccount } from "wagmi";
import { Inter } from "next/font/google";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../auth/Auth";
import UserSettingsGoToUser from "./UserSettingsGoToUser";
import { commonApiFetch } from "../../../services/api/common-api";
import { IProfileAndConsolidations } from "../../../entities/IProfile";

import UserSettingsPage from "./UserSettingsPage";
import UserSettingsPfp from "./UserSettingsPfp";
interface Props {
  user: string;
  wallets: string[];
}

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserSettingsComponent(props: Props) {
  const account = useAccount();
  const router = useRouter();
  const { requestAuth, setToast } = useContext(AuthContext);
  const [init, setInit] = useState(false);
  const [userOrWallet] = useState(
    Array.isArray(router.query.user)
      ? router.query.user.at(0)
      : router.query.user
  );

  const [user, setUser] = useState<IProfileAndConsolidations | null>(null);

  useEffect(() => {
    if (!init || !userOrWallet) {
      return;
    }
    const getUser = async () => {
      if (!account.address) {
        router.push("/404");
        return;
      }

      if (!userOrWallet) {
        router.push("/404");
        return;
      }

      try {
        const response = await commonApiFetch<IProfileAndConsolidations>({
          endpoint: `profiles/${userOrWallet}`,
        });

        const consolidations = response.consolidation.wallets.map((w) => ({
          ...w,
          wallet: w.wallet.toLowerCase(),
        }));

        const wallets = consolidations.map((w) => w.wallet);

        if (!wallets.includes(account.address.toLowerCase())) {
          router.push("/404");
          return;
        }
        setUser(response);
      } catch (e: any) {
        setToast({
          message: e?.message ?? "Something went wrong",
          type: "error",
        });
        router.push("/404");
      }
    };
    getUser();
  }, [userOrWallet, init]);

  useEffect(() => {
    setInit(false);
    const checkLogin = async () => {
      const { success } = await requestAuth();
      if (!success) {
        router.push("/404");
        return;
      }
      setInit(true);
    };
    checkLogin();
  }, [account?.address]);

  if (!init || !account.address || !userOrWallet || !user) return <></>;
  return (
    <div
      id="allowlist-tool"
      className={`tw-bg-neutral-900 tw-overflow-y-auto tw-min-h-screen tw-relative ${inter.className}`}
    >
      <div className="tw-max-w-lg tw-mx-auto tw-pt-8 tw-pb-12">
        <UserSettingsGoToUser user={user.profile?.handle ?? userOrWallet} />
        <UserSettingsPage user={user} onUser={setUser} />
        {/* <UserSettingsPfp
          user={"0x23a867C9b39c940E9467f5b3B43FA0e5a2bD1e6E"}
          wallets={["0x23a867C9b39c940E9467f5b3B43FA0e5a2bD1e6E"]}
        /> */}
      </div>
    </div>
  );
}
