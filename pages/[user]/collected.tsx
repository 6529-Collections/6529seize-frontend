import { ReactElement } from "react"
import { NextPageWithLayout } from "../_app"
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import { NFT, NFTLite } from "../../entities/INFT";
import { Season } from "../../entities/ISeason";
import { OwnerLite } from "../../entities/IOwner";
import { ENS } from "../../entities/IENS";
import { commonApiFetch } from "../../services/api/common-api";
import { areEqualAddresses, containsEmojis, formatAddress } from "../../helpers/Helpers";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { getCommonUserServerSideProps, userPageNeedsRedirect } from "./server.helpers";


export interface UserPageCollectedProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  memesLite: NFTLite[];
}

const Page: NextPageWithLayout<{ pageProps: UserPageCollectedProps }> = ({ pageProps }) => {
  return <div>collected</div>
}

Page.getLayout = function getLayout(page: ReactElement<{ pageProps: UserPageCollectedProps }>) {
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
  props: UserPageCollectedProps;
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

    const memesLite = await commonApiFetch<{ data: NFTLite[] }>({
      endpoint: "memes_lite",
      headers,
    })

    return {
      props: {
        profile,
        title,
        consolidatedTDH,
        memesLite: memesLite.data,
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
