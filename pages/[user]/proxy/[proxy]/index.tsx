import { ReactElement, useContext } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { NextPageWithLayout } from "../../../_app";
import { ReactQueryWrapperContext } from "../../../../components/react-query-wrapper/ReactQueryWrapper";
import UserPageLayout from "../../../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getProxyById,
  getUserProfile,
  userPageNeedsRedirect,
} from "../../../../helpers/server.helpers";
import UserPageProxyItem from "../../../../components/user/proxy/proxy/UserPageProxyItem";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export interface UserPageProxyProps {
  readonly profile: IProfileAndConsolidations;
  readonly profileProxy: ProfileProxy;
}

const Page: NextPageWithLayout<{ pageProps: UserPageProxyProps }> = ({
  pageProps,
}) => {
  const { setProfile, setProfileProxy } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);
  setProfileProxy(pageProps.profileProxy);
  return (
    <UserPageProxyItem
      profile={pageProps.profile}
      profileProxy={pageProps.profileProxy}
    />
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageProxyProps }>
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
  props: UserPageProxyProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const proxyId = req.query.proxy as string;
    const [profile, profileProxy] = await Promise.all([
      getUserProfile({ user: handleOrWallet, headers }),
      getProxyById({ proxyId, headers }),
    ]);

    if (
      !profile.profile?.external_id ||
      ![profileProxy.created_by.id, profileProxy.granted_to.id].includes(
        profile.profile?.external_id
      )
    ) {
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
      subroute: `proxy/${proxyId}`,
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        profileProxy,
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
