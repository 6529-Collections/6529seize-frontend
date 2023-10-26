import { useAccount } from "wagmi";
import { Inter } from "next/font/google";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext, IProfileWithMeta } from "../../auth/Auth";
import UserSettingsGoToUser from "./UserSettingsGoToUser";
import { commonApiFetch } from "../../../services/api/common-api";
import {
  IProfile,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import UserSettingsPage from "./UserSettingsPage";

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

  const [user, setUser] = useState<IProfileWithMeta | null>(null);

  const goToUser = () => {
    router.push(`/${user}`);
  };

  const mapApiResponseToUser = (
    response: IProfileAndConsolidations
  ): IProfileWithMeta => {
    return {
      ...response,
      consolidation: {
        ...response.consolidation,
        wallets: response.consolidation.wallets.map((w) => ({
          ...w,
          wallet: {
            ...w.wallet,
            address: w.wallet.address.toLowerCase(),
            ens: w.wallet.ens ?? null,
          },
          displayName: w.wallet.ens ?? w.wallet.address.toLowerCase(),
        })),
      },
    };
  };

  const onUser = (user: IProfileAndConsolidations) =>
    setUser(mapApiResponseToUser(user));

  useEffect(() => {
    if (!init || !userOrWallet) {
      return;
    }
    const getUser = async () => {
      if (!account.address) {
        goToUser();
        return;
      }

      if (!userOrWallet) {
        goToUser();
        return;
      }

      try {
        const response = await commonApiFetch<IProfileAndConsolidations>({
          endpoint: `profiles/${userOrWallet}`,
        });
        const lowerCaseWallets = response.consolidation.wallets.map((w) =>
          w.wallet.address.toLowerCase()
        );
        const lowerCaseAccount = account.address.toLowerCase();
        if (!lowerCaseWallets.includes(lowerCaseAccount)) {
          goToUser();
          return;
        }
        onUser(response);
      } catch (e: any) {
        setToast({
          message: e?.message ?? "Something went wrong",
          type: "error",
        });
        goToUser();
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
      <div className="tw-max-w-2xl tw-mx-auto tw-pt-8 tw-pb-12">
        <UserSettingsGoToUser
          user={user.profile?.handle ?? userOrWallet.toLowerCase()}
        />
        <UserSettingsPage user={user} onUser={onUser} />
      </div>
    </div>
  );
}
