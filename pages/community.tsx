import { FullPageRequest } from "../helpers/Types";
import Head from "next/head";
import { Crumb } from "../components/breadcrumb/Breadcrumb";
import SidebarLayout from "../components/utils/sidebar/SidebarLayout";
import CommunityMembers from "../components/community/CommunityMembers";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../store/groupSlice";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../generated/models/GroupFull";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../services/api/common-api";
import { useEffect, useState } from "react";

export enum CommunityMembersSortOption {
  DISPLAY = "display",
  LEVEL = "level",
  TDH = "tdh",
  REP = "rep",
  CIC = "cic",
}

export interface CommunityMembersQuery
  extends FullPageRequest<CommunityMembersSortOption> {
  group_id?: string;
}

export default function CommunityPage() {
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
        { display: "Community", href: "/community" },
        { display: activeGroup.name },
      ];
    }
    return [{ display: "Home", href: "/" }, { display: "Community" }];
  };

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(getBreadcrumbs());

  useEffect(() => {
    setBreadcrumbs(getBreadcrumbs());
  }, [activeGroupId, activeGroup]);

  return (
    <>
      <Head>
        <title>Community | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community`}
        />
        <meta property="og:title" content="Community" />
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
