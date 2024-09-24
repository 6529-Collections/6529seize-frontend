import { FullPageRequest } from "../../helpers/Types";
import Head from "next/head";
import { Crumb } from "../../components/breadcrumb/Breadcrumb";
import SidebarLayout from "../../components/utils/sidebar/SidebarLayout";
import CommunityMembers from "../../components/community/CommunityMembers";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../store/groupSlice";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../generated/models/GroupFull";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
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
      title: "Network | 6529 SEIZE",
    });
  }, []);

  const activeGroupId = useSelector(selectActiveGroupId);
  const { data: activeGroup } = useQuery<GroupFull>({
    queryKey: [QueryKey.GROUP, activeGroupId],
    queryFn: async () =>
      await commonApiFetch<GroupFull>({
        endpoint: `groups/${activeGroupId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!activeGroupId,
  });

  const getBreadcrumbs = (): Crumb[] => {
    if (activeGroupId && activeGroup) {
      return [
        { display: "Home", href: "/" },
        { display: "Network", href: "/network" },
        { display: activeGroup.name },
      ];
    }
    return [{ display: "Home", href: "/" }, { display: "Network" }];
  };

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(getBreadcrumbs());

  useEffect(() => {
    setBreadcrumbs(getBreadcrumbs());
  }, [activeGroupId, activeGroup]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Network | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/network`}
        />
        <meta property="og:title" content="Network" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <SidebarLayout breadcrumbs={breadcrumbs}>
        <CommunityMembers />
      </SidebarLayout>
    </>
  );
}
