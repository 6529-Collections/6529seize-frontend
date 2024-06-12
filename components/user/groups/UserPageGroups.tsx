import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import GroupsList from "../../groups/page/list/GroupsList";
import { AuthContext } from "../../auth/Auth";
import { GroupsRequestParams } from "../../../entities/IGroup";

export default function UserPageGroups({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowCreateNewGroupButton = () => {
    return (
      !!connectedProfile?.profile?.handle &&
      !activeProfileProxy &&
      connectedProfile.profile.handle === profile.profile?.handle
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
    author_identity: profile.profile?.handle ?? null,
  });

  useEffect(() => {
    setFilters({
      group_name: null,
      author_identity: profile.profile?.handle ?? null,
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
  return (
    <GroupsList
      filters={filters}
      showIdentitySearch={false}
      showCreateNewGroupButton={showCreateNewGroupButton}
      onCreateNewGroup={() => {}}
      setGroupName={setGroupName}
      setAuthorIdentity={setAuthorIdentity}
    />
  );
}
