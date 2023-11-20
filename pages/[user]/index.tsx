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


export interface UserPageProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  gradients: NFT[];
}

const Page: NextPageWithLayout<{ pageProps: UserPageProps }> = ({ pageProps }) => {
  return <div>index</div>
}

Page.getLayout = function getLayout(page: ReactElement<{ pageProps: UserPageProps }>) {
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
  props: UserPageProps;
}> {

  const getGradients = async (
    headers: Record<string, string>
  ): Promise<NFT[]> => {
    const gradients = await commonApiFetch<{ data: NFT[] }>({
      endpoint: "nfts/gradients?&page_size=101&sort=ASC&sort_direction=id",
      headers,
    });
    return gradients.data;
  };

  const authCookie = req?.req?.cookies["x-6529-auth"];
  try {
    const headers: Record<string, string> = authCookie
      ? { "x-6529-auth": authCookie }
      : {};

    const { profile, title, consolidatedTDH } = await getCommonUserServerSideProps({ user: req.query.user, headers })

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: null
    })

    if (needsRedirect) {
      return needsRedirect as any
    }

    const gradients = await getGradients(headers)
    return {
      props: {
        profile,
        title,
        consolidatedTDH,
        gradients,
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
