import { ReactElement } from "react";
import { IProfileAndConsolidations } from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { getCommonHeaders, getUserProfile, userPageNeedsRedirect } from "../../helpers/server.helpers";
import UserPageGroupsWrapper from "../../components/user/groups/UserPageGroupsWrapper";

export interface UserPageGroupsProps {
  readonly profile: IProfileAndConsolidations;
}

const Page: NextPageWithLayout<{ pageProps: UserPageGroupsProps }> = ({
  pageProps,
}) => {

  return (
    <UserPageGroupsWrapper
      profile={pageProps.profile}
    />
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageGroupsProps }>
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
  props: UserPageGroupsProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const handleOrWallet = req.query.user.toLowerCase() as string;
    const profile = await getUserProfile({ user: handleOrWallet, headers });
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
