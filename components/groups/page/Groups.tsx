"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useState, type JSX } from "react";
import GroupCreate from "./create/GroupCreate";
import { AuthContext } from "@/components/auth/Auth";
import GroupsPageListWrapper from "./GroupsPageListWrapper";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSetTitle } from "@/contexts/TitleContext";

enum GroupsViewMode {
  CREATE = "CREATE",
  VIEW = "VIEW",
}

const GROUP_EDIT_SEARCH_PARAM = "edit";

export default function Groups() {
  useSetTitle("Groups | Network");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { connectedProfile, requestAuth, activeProfileProxy } =
    useContext(AuthContext);

  const edit = searchParams?.get(GROUP_EDIT_SEARCH_PARAM);

  const [viewMode, setViewMode] = useState(GroupsViewMode.VIEW);

  const onViewModeChange = useCallback(
    async (mode: GroupsViewMode): Promise<void> => {
      if (mode === GroupsViewMode.CREATE) {
        const { success } = await requestAuth();
        if (!success) return;
      } else if (pathname) {
        router.replace(pathname);
      }

      setViewMode(mode);
    },
    [pathname, requestAuth, router],
  );

  const triggerViewModeChange = useCallback(
    (mode: GroupsViewMode): void => {
      onViewModeChange(mode).catch((error) => {
        console.error("Failed to update groups view mode", error);
      });
    },
    [onViewModeChange],
  );

  const connectedHandle = connectedProfile?.handle;

  useEffect(() => {
    if (edit && !!connectedHandle && !activeProfileProxy) {
      triggerViewModeChange(GroupsViewMode.CREATE);
    }
  }, [activeProfileProxy, connectedHandle, edit, triggerViewModeChange]);

  useEffect(() => {
    if (!connectedHandle || activeProfileProxy) {
      triggerViewModeChange(GroupsViewMode.VIEW);
    }
  }, [activeProfileProxy, connectedHandle, triggerViewModeChange]);

  const components: Record<GroupsViewMode, JSX.Element> = {
    [GroupsViewMode.VIEW]: (
      <GroupsPageListWrapper
        onCreateNewGroup={() => triggerViewModeChange(GroupsViewMode.CREATE)}
      />
    ),
    [GroupsViewMode.CREATE]: (
      <GroupCreate
        onCompleted={() => triggerViewModeChange(GroupsViewMode.VIEW)}
        edit={edit ?? "new"}
      />
    ),
  };

  return (
    <div>
      <div className="tailwind-scope">
        {viewMode === GroupsViewMode.CREATE && (
          <button
            onClick={() => triggerViewModeChange(GroupsViewMode.VIEW)}
            type="button"
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            />
            <span>Back</span>
          </button>
        )}
      </div>

      <h1>Groups</h1>

      {components[viewMode]}
    </div>
  );
}
