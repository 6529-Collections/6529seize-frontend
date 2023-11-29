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
import UserPageIdentity from "../../components/user/identity/UserPageIdentity";
import { useQueryClient } from "@tanstack/react-query";

export interface UserPageIdentityProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

const Page: NextPageWithLayout<{ pageProps: UserPageIdentityProps }> = ({
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
  return <UserPageIdentity profile={pageProps.profile} />;
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageIdentityProps }>
) {
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageIdentityProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const { profile, title, consolidatedTDH } =
      await getCommonUserServerSideProps({ user: req.query.user, headers });
    if (!profile.profile) {
      return {
        redirect: {
          permanent: false,
          destination: "/404",
        },
        props: {},
      } as any;
    }

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
