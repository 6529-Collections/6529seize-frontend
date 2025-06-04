import {
  getCommonHeaders,
  getUserProfileActivityLogs,
} from "../../helpers/server.helpers";
import { CountlessPage } from "../../helpers/Types";
import { ProfileActivityLog } from "../../entities/IProfile";
import ProfileActivityLogs, {
  ActivityLogParams,
  convertActivityLogParams,
} from "../../components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "../../components/utils/CommonFilterTargetSelect";
import { useContext, useEffect } from "react";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";
import SidebarLayout from "../../components/utils/sidebar/SidebarLayout";
import { getProfileLogTypes } from "../../helpers/profile-logs.helpers";
import { AuthContext } from "../../components/auth/Auth";

const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 50,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
  groupId: null,
};

export interface CommunityActivityPageProps {
  readonly logsPage: CountlessPage<ProfileActivityLog>;
}

export default function CommunityActivityPage({
  pageProps,
}: {
  readonly pageProps: CommunityActivityPageProps;
}) {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Activity | Network",
    });
  }, []);

  const { initCommunityActivityPage } = useContext(ReactQueryWrapperContext);
  initCommunityActivityPage({
    activityLogs: {
      data: pageProps.logsPage,
      params: INITIAL_ACTIVITY_LOGS_PARAMS,
    },
  });

  return (
    <SidebarLayout>
      <ProfileActivityLogs
        initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
        withFilters={true}>
        <h1 className="tw-block tw-float-none tw-whitespace-nowrap">
          <span className="font-lightest">Network</span> Activity
        </h1>
      </ProfileActivityLogs>
    </SidebarLayout>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: CommunityActivityPageProps;
}> {
  try {
    const headers = getCommonHeaders(req);
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: INITIAL_ACTIVITY_LOGS_PARAMS,
        disableActiveGroup: true,
      }),
    });
    return {
      props: {
        logsPage,
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

CommunityActivityPage.metadata = {
  title: "Activity",
  description: "Network",
};
