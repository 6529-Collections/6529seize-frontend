import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  userPageNeedsRedirect,
} from "./server.helpers";
import UserPageStats from "../../components/user/stats/UserPageStats";
import { useQueryClient } from "@tanstack/react-query";

export interface UserPageStatsProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

const Page: NextPageWithLayout<{ pageProps: UserPageStatsProps }> = ({
  pageProps,
}) => {
  const queryClient = useQueryClient();
  if (pageProps.profile.profile?.handle) {
    queryClient.setQueryData<IProfileAndConsolidations>(
      ["profile", pageProps.profile.profile?.handle.toLowerCase()],
      pageProps.profile
    );
  }

  for (const wallet of pageProps.profile.consolidation.wallets) {
    queryClient.setQueryData<IProfileAndConsolidations>(
      ["profile", wallet.wallet.address.toLowerCase()],
      pageProps.profile
    );

    if (wallet.wallet.ens) {
      queryClient.setQueryData<IProfileAndConsolidations>(
        ["profile", wallet.wallet.ens.toLowerCase()],
        pageProps.profile
      );
    }
  }
  return (
    <UserPageStats
      profile={pageProps.profile}
      consolidatedTDH={pageProps.consolidatedTDH}
    />
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageStatsProps }>
) {
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageStatsProps;
}> {
  const authCookie = req?.req?.cookies["x-6529-auth"] ?? null;
  const walletAuthCookie = req?.req?.cookies["wallet-auth"] ?? null;
  try {
    const headers: Record<string, string> = getCommonHeaders({
      authCookie,
      walletAuthCookie,
    });

    const { profile, title, consolidatedTDH } =
      await getCommonUserServerSideProps({ user: req.query.user, headers });
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "collected",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        title,
        consolidatedTDH,
      },
    };
  } catch (e: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }
}
