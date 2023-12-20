import { ReactElement, useContext } from "react";
import { NextPageWithLayout } from "../_app";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getMemesLite,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageStats from "../../components/user/stats/UserPageStats";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { NFTLite } from "../../entities/INFT";

export interface UserPageStatsProps {
  readonly profile: IProfileAndConsolidations;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly memesLite: NFTLite[];
}

const Page: NextPageWithLayout<{ pageProps: UserPageStatsProps }> = ({
  pageProps,
}) => {
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  return (
    <UserPageStats
      profile={pageProps.profile}
      consolidatedTDH={pageProps.consolidatedTDH}
      memesLite={pageProps.memesLite}
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
  try {
    const headers = getCommonHeaders(req);

    const [{ profile, title, consolidatedTDH }, memesLite] = await Promise.all([
      getCommonUserServerSideProps({ user: req.query.user, headers }),
      getMemesLite(headers),
    ]);
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
        memesLite,
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
