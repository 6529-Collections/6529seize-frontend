import { useAccount } from "wagmi";
import { Inter } from "next/font/google";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../auth/Auth";
import UserSettingsGoToUser from "./UserSettingsGoToUser";
import { commonApiFetch } from "../../../services/api/common-api";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import UserSettingsPage from "./UserSettingsPage";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";

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

export default function UserSettingsComponent(props: Readonly<Props>) {
  const account = useAccount();
  const router = useRouter();
  const { requestAuth, setToast } = useContext(AuthContext);
  const {
    invalidateProfile,
    invalidateHandles,
    invalidateProfileLogs,
    invalidateProfileLogsByHandles,
  } = useContext(ReactQueryWrapperContext);
  const [init, setInit] = useState(false);
  const [userOrWallet] = useState(
    Array.isArray(router.query.user)
      ? router.query.user.at(0)
      : router.query.user
  );

  const [user, setUser] = useState<IProfileAndConsolidations | null>(null);

  const goToUser = () => {
    router.push(`/${userOrWallet}`);
  };

  const onUser = (newUser: IProfileAndConsolidations) => {
    const oldHandles: string[] = [];
    if (user?.profile?.handle) {
      oldHandles.push(user.profile.handle.toLowerCase());
    }
    user?.consolidation.wallets.forEach((wallet) => {
      oldHandles.push(wallet.wallet.address.toLowerCase());
      if (wallet.wallet.ens) {
        oldHandles.push(wallet.wallet.ens.toLowerCase());
      }
    });
    invalidateProfile(newUser);
    invalidateProfileLogs({ profile: newUser, keys: {} });
    invalidateHandles(oldHandles);
    invalidateProfileLogsByHandles({ handles: oldHandles, keys: {} });
    setUser(newUser);
  };

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
        goToUser();
        return;
      }
      setInit(true);
    };
    checkLogin();
  }, [account?.address]);

  if (!init || !account.address || !userOrWallet || !user) return <></>;
  return (
    <div
      className={`tailwind-scope tw-bg-iron-950 tw-overflow-y-auto tw-min-h-screen tw-relative ${inter.className}`}
    >
      <div className="tw-max-w-2xl tw-mx-auto tw-pt-8 tw-pb-16 lg:tw-pb-20 tw-px-6 md:tw-px-0">
        <UserSettingsGoToUser
          user={user.profile?.handle ?? userOrWallet.toLowerCase()}
        />
        <UserSettingsPage user={user} onUser={onUser} />
      </div>
    </div>
  );
}
