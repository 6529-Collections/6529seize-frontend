"use client";

import { AuthContext } from "@/components/auth/Auth";
import GroupsList from "@/components/groups/page/list/GroupsList";
import type { GroupsRequestParams } from "@/entities/IGroup";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
export default function UserPageGroups({
  profile,
}: {
  readonly profile: ApiIdentity | null;
}) {
  const router = useRouter();
  const { connectedProfile, activeProfileProxy, requestAuth } =
    useContext(AuthContext);
  const getShowCreateNewGroupButton = () => {
    return (
      !!connectedProfile?.handle &&
      !activeProfileProxy &&
      connectedProfile.handle === profile?.handle
    );
  };
  const [showCreateNewGroupButton, setShowCreateNewGroupButton] = useState(
    getShowCreateNewGroupButton()
  );

  useEffect(() => {
    setShowCreateNewGroupButton(getShowCreateNewGroupButton());
  }, [connectedProfile, profile, activeProfileProxy]);

  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: null,
    author_identity: profile?.handle ?? null,
  });

  useEffect(() => {
    setFilters({
      group_name: null,
      author_identity: profile?.handle ?? null,
    });
  }, [profile]);

  const setGroupName = (value: string | null) => {
    setFilters({
      ...filters,
      group_name: value,
    });
  };

  const setAuthorIdentity = (value: string | null) => {
    setFilters({
      ...filters,
      author_identity: value,
    });
  };

  const onCreateNewGroup = async () => {
    const { success } = await requestAuth();
    if (!success) {
      return;
    }
    router.push("/network/groups?edit=new");
  };

  return (
    <div className="tailwind-scope">
      <GroupsList
        filters={filters}
        showIdentitySearch={false}
        showCreateNewGroupButton={showCreateNewGroupButton}
        showMyGroupsButton={false}
        onCreateNewGroup={onCreateNewGroup}
        setGroupName={setGroupName}
        setAuthorIdentity={setAuthorIdentity}
        onMyGroups={() => {}}
      />
    </div>
  );
}
