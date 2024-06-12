import { useContext, useEffect, useState } from "react";
import GroupsList from "./list/GroupsList";
import { AuthContext } from "../../auth/Auth";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import { GroupsRequestParams } from "../../../entities/IGroup";

const IDENTITY_SEARCH_PARAM = "identity";
const GROUP_NAME_SEARCH_PARAM = "group";


export default function GroupsPageListWrapper({
  onCreateNewGroup,
}: {
  readonly onCreateNewGroup: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowCreateNewGroupButton = () => {
    return !!connectedProfile?.profile?.handle && !activeProfileProxy;
  };

  const [showCreateNewGroupButton, setShowCreateNewGroupButton] = useState(
    getShowCreateNewGroupButton()
  );
  useEffect(() => {
    setShowCreateNewGroupButton(getShowCreateNewGroupButton());
  }, [connectedProfile, activeProfileProxy]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identity = searchParams.get(IDENTITY_SEARCH_PARAM);
  const group = searchParams.get(GROUP_NAME_SEARCH_PARAM);


  const [filters, setFilters] = useState<GroupsRequestParams>({
    group_name: group,
    author_identity: identity,
  });

  useEffect(() => {
    setFilters({
      group_name: group,
      author_identity: identity,
    });
  }, [group, identity]);

  const createQueryString = (
    config: {
      name: string;
      value: string | null;
    }[]
  ): string => {
    const params = new URLSearchParams(searchParams.toString());
    for (const { name, value } of config) {
      if (!value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    }
    return params.toString();
  };

  const setGroupName = (value: string | null) => {
    router.replace(
      pathname +
        "?" +
        createQueryString([
          {
            name: GROUP_NAME_SEARCH_PARAM,
            value,
          },
        ]),
      undefined,
      { shallow: true }
    );
  };

  const setAuthorIdentity = (value: string | null) => {
    router.replace(
      pathname +
        "?" +
        createQueryString([
          {
            name: IDENTITY_SEARCH_PARAM,
            value,
          },
        ]),
      undefined,
      { shallow: true }
    );
  };

  return (
    <GroupsList
      filters={filters}
      showIdentitySearch={true}
      showCreateNewGroupButton={showCreateNewGroupButton}
      onCreateNewGroup={onCreateNewGroup}
      setGroupName={setGroupName}
      setAuthorIdentity={setAuthorIdentity}
    />
  );
}
