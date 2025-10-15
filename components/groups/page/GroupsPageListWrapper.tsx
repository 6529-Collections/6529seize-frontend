"use client";

import {
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GroupsList from "./list/GroupsList";
import { AuthContext } from "@/components/auth/Auth";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { GroupsRequestParams } from "@/entities/IGroup";
import { useDebounce } from "react-use";

const IDENTITY_SEARCH_PARAM = "identity";
const GROUP_NAME_SEARCH_PARAM = "group";
const CREATED_AT_LESS_THAN_SEARCH_PARAM = "created_at_less_than";

export default function GroupsPageListWrapper({
  onCreateNewGroup,
}: {
  readonly onCreateNewGroup: () => void;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowCreateNewGroupButton = () => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  };

  const [showCreateNewGroupButton, setShowCreateNewGroupButton] = useState(
    getShowCreateNewGroupButton()
  );

  const getShowMyGroupsButton = () =>
    !!connectedProfile?.handle || !!activeProfileProxy;

  const [showMyGroupsButton, setShowMyGroupsButton] = useState(
    getShowMyGroupsButton()
  );
  useEffect(() => {
    setShowCreateNewGroupButton(getShowCreateNewGroupButton());
    setShowMyGroupsButton(getShowMyGroupsButton());
  }, [connectedProfile, activeProfileProxy]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const identity = searchParams?.get(IDENTITY_SEARCH_PARAM);
  const group = searchParams?.get(GROUP_NAME_SEARCH_PARAM);

  const [groupDraft, setGroupDraft] = useState<string | null>(group ?? null);
  const lastSyncedGroupRef = useRef<string | null>(group ?? null);
  const filters = useMemo<GroupsRequestParams>(
    () => ({
      group_name: groupDraft,
      author_identity: identity ?? null,
    }),
    [groupDraft, identity]
  );

  useEffect(() => {
    const nextGroup = group ?? null;
    lastSyncedGroupRef.current = nextGroup;
    setGroupDraft(nextGroup);
  }, [group]);

  const createQueryString = useCallback(
    (
      config: {
        name: string;
        value: string | null;
      }[]
    ): string => {
      const params = new URLSearchParams(searchParams.toString());
      for (const { name, value } of config) {
        if (value == null || value === "") {
          params.delete(name);
        } else {
          params.set(name, value);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const updateGroupNameParam = useCallback(
    (value: string | null) => {
      const query = createQueryString([
        {
          name: GROUP_NAME_SEARCH_PARAM,
          value,
        },
        {
          name: CREATED_AT_LESS_THAN_SEARCH_PARAM,
          value: null,
        },
      ]);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [createQueryString, pathname, router]
  );

  useDebounce(
    () => {
      if (groupDraft === lastSyncedGroupRef.current) {
        return;
      }
      lastSyncedGroupRef.current = groupDraft;
      updateGroupNameParam(groupDraft);
    },
    200,
    [groupDraft, updateGroupNameParam]
  );

  const setGroupName = useCallback(
    (value: string | null) => {
      setGroupDraft(value);
      if (lastSyncedGroupRef.current === value) {
        return;
      }
      lastSyncedGroupRef.current = value;
      updateGroupNameParam(value);
    },
    [updateGroupNameParam]
  );

  const setAuthorIdentity = useCallback(
    (value: string | null) => {
      const query = createQueryString([
        {
          name: IDENTITY_SEARCH_PARAM,
          value,
        },
        {
          name: CREATED_AT_LESS_THAN_SEARCH_PARAM,
          value: null,
        },
      ]);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [createQueryString, pathname, router]
  );

  const onMyGroups = useCallback(() => {
    if (!connectedProfile?.handle) {
      return;
    }
    if (activeProfileProxy?.created_by?.handle) {
      setAuthorIdentity(activeProfileProxy.created_by.handle);
      return;
    }
    setAuthorIdentity(connectedProfile.handle);
  }, [
    activeProfileProxy?.created_by?.handle,
    connectedProfile?.handle,
    setAuthorIdentity,
  ]);

  return (
    <GroupsList
      filters={filters}
      showIdentitySearch={true}
      showCreateNewGroupButton={showCreateNewGroupButton}
      showMyGroupsButton={showMyGroupsButton}
      onCreateNewGroup={onCreateNewGroup}
      setGroupName={setGroupName}
      setAuthorIdentity={setAuthorIdentity}
      onMyGroups={onMyGroups}
    />
  );
}
