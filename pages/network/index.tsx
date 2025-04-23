import { FullPageRequest } from "../../helpers/Types";
import Head from "next/head";
import SidebarLayout from "../../components/utils/sidebar/SidebarLayout";
import CommunityMembers from "../../components/community/CommunityMembers";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../store/groupSlice";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiGroupFull } from "../../generated/models/ApiGroupFull";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";
import { CommunityMembersSortOption } from "../../enums";

export interface CommunityMembersQuery
  extends FullPageRequest<CommunityMembersSortOption> {
  group_id?: string;
}

export default function CommunityPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Network | 6529.io",
    });
  }, [setTitle]);

  const activeGroupId = useSelector(selectActiveGroupId);
  useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, activeGroupId],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${activeGroupId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!activeGroupId,
  });

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Network | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network`}
        />
        <meta property="og:title" content="Network" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <SidebarLayout>
        <CommunityMembers />
      </SidebarLayout>
    </>
  );
}
