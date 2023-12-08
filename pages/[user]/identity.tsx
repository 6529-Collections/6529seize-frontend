import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import {
  CicStatement,
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfilesMatterRatingWithRaterLevel,
} from "../../entities/IProfile";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getUserProfileActivityLogs,
  getUserProfileCICRatings,
  getUserProfileIdentityStatements,
  userPageNeedsRedirect,
} from "./server.helpers";
import UserPageIdentity from "../../components/user/identity/UserPageIdentity";
import { useQueryClient } from "@tanstack/react-query";
import UserPageIdentityNoProfile from "../../components/user/identity/UserPageIdentityNoProfile";
import { Page as PageType } from "../../helpers/Types";

export interface UserPageIdentityProps {
  profile: IProfileAndConsolidations;
  title: string;
  consolidatedTDH: ConsolidatedTDHMetrics | null;
  profileActivityLogs: PageType<ProfileActivityLog>;
  profileCICRatings: PageType<ProfilesMatterRatingWithRaterLevel>;
  profileIdentityStatements: CicStatement[];
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

  if (!pageProps.profile.profile) {
    return <UserPageIdentityNoProfile profile={pageProps.profile} />;
  }

  return (
    <UserPageIdentity
      profile={pageProps.profile}
      profileActivityLogs={pageProps.profileActivityLogs}
      profileCICRatings={pageProps.profileCICRatings}
      profileIdentityStatements={pageProps.profileIdentityStatements}
    />
  );
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

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "collected",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    const [profileActivityLogs, profileCICRatings, profileIdentityStatements] =
      await Promise.all([
        getUserProfileActivityLogs({
          user: req.query.user,
          headers,
        }),
        getUserProfileCICRatings({
          user: req.query.user,
          headers,
        }),
        getUserProfileIdentityStatements({
          user: req.query.user,
          headers,
        }),
      ]);

    return {
      props: {
        profile,
        title,
        consolidatedTDH,
        profileActivityLogs,
        profileCICRatings,
        profileIdentityStatements,
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
