import { ReactElement } from "react"
import { NextPageWithLayout } from "../_app"
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { getCommonUserServerSideProps, userPageNeedsRedirect } from "./server.helpers";
import UserPageStats from "../../components/user/stats/UserPageStats";


export interface UserPageStatsProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}

const Page: NextPageWithLayout<{ pageProps: UserPageStatsProps }> = ({ pageProps }) => {
  return <UserPageStats profile={pageProps.profile} consolidatedTDH={pageProps.consolidatedTDH} />
}

Page.getLayout = function getLayout(page: ReactElement<{ pageProps: UserPageStatsProps }>) {
  return (
    <UserPageLayout props={page.props.pageProps}>
      {page}
    </UserPageLayout>
  )
}

export default Page

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageStatsProps;
}> {
  const authCookie = req?.req?.cookies["x-6529-auth"];
  try {
    const headers: Record<string, string> = authCookie
      ? { "x-6529-auth": authCookie }
      : {};

    const { profile, title, consolidatedTDH } = await getCommonUserServerSideProps({ user: req.query.user, headers })
    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: 'collected'
    })

    if (needsRedirect) {
      return needsRedirect as any
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
