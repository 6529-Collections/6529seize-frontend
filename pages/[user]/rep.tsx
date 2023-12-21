import { ReactElement, useContext } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
} from "../../entities/IProfile";
import { NextPageWithLayout } from "../_app";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import UserPageLayout from "../../components/user/layout/UserPageLayout";
import { ConsolidatedTDHMetrics } from "../../entities/ITDH";
import {
  getCommonHeaders,
  getCommonUserServerSideProps,
  getProfileRatings,
  userPageNeedsRedirect,
} from "../../helpers/server.helpers";
import UserPageRep from "../../components/user/rep/UserPageRep";

export interface UserPageRepProps {
  readonly profile: IProfileAndConsolidations;
  readonly title: string;
  readonly consolidatedTDH: ConsolidatedTDHMetrics | null;
  readonly repRates: ApiProfileRepRatesState;
}

const Page: NextPageWithLayout<{ pageProps: UserPageRepProps }> = ({
  pageProps,
}) => {
  const { setProfile } = useContext(ReactQueryWrapperContext);
  setProfile(pageProps.profile);

  return (
    <div className="tailwind-scope">
      <UserPageRep profile={pageProps.profile} repRates={pageProps.repRates} />
    </div>
  );
};

Page.getLayout = function getLayout(
  page: ReactElement<{ pageProps: UserPageRepProps }>
) {
  return <UserPageLayout props={page.props.pageProps}>{page}</UserPageLayout>;
};

export default Page;

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: UserPageRepProps;
}> {
  try {
    const headers = getCommonHeaders(req);

    const [{ profile, title, consolidatedTDH }, repRates] = await Promise.all([
      getCommonUserServerSideProps({ user: req.query.user, headers }),
      getProfileRatings({ user: req.query.user, headers }),
    ]);

    const needsRedirect = userPageNeedsRedirect({
      profile,
      req,
      subroute: "rep",
    });

    if (needsRedirect) {
      return needsRedirect as any;
    }

    return {
      props: {
        profile,
        title,
        consolidatedTDH,
        repRates,
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
