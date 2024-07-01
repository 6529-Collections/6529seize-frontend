import { ReactElement, useContext } from "react";
import { NextPageWithLayout } from "../_app";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageStats from "../../components/user/stats/UserPageStats";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";

export interface UserPageStatsProps {
  readonly profile: IProfileAndConsolidations;
}

const Page: NextPageWithLayout<{ pageProps: UserPageStatsProps }> = ({
  pageProps,
}) => {
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  return <UserPageStats profile={pageProps.profile} />;
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageStatsProps }>
) {
  return (
    <UserPageLayout profile={page.props.pageProps.profile}>
      {page}
    </UserPageLayout>
  );
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
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "stats",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
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
