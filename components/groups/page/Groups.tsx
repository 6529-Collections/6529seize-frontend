"use client";

import { AuthContext } from "@/components/auth/Auth";
import { NETWORK_PAGE_TITLE_CLASSES } from "@/components/network/networkPageLayoutClasses";
import { useSetTitle } from "@/contexts/TitleContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, type JSX } from "react";
import GroupCreate from "./create/GroupCreate";
import GroupsPageListWrapper from "./GroupsPageListWrapper";

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

  const onViewModeChange = async (mode: GroupsViewMode): Promise<void> => {
    if (mode === GroupsViewMode.CREATE) {
      const { success } = await requestAuth();
      if (!success) return;
    } else if (pathname) {
      router.replace(pathname);
    }

    setViewMode(mode);
  };

  useEffect(() => {
    if (edit && !!connectedProfile?.handle && !activeProfileProxy) {
      onViewModeChange(GroupsViewMode.CREATE);
    }
  }, [edit]);

  useEffect(() => {
    if (!connectedProfile?.handle || activeProfileProxy) {
      onViewModeChange(GroupsViewMode.VIEW);
    }
  }, [connectedProfile, activeProfileProxy]);

  const components: Record<GroupsViewMode, JSX.Element> = {
    [GroupsViewMode.VIEW]: (
      <GroupsPageListWrapper
        onCreateNewGroup={() => onViewModeChange(GroupsViewMode.CREATE)}
      />
    ),
    [GroupsViewMode.CREATE]: (
      <GroupCreate
        onCompleted={() => onViewModeChange(GroupsViewMode.VIEW)}
        edit={edit ?? "new"}
      />
    ),
  };

  return (
    <div>
      <div className="tailwind-scope">
        {viewMode === GroupsViewMode.CREATE && (
          <button
            onClick={() => onViewModeChange(GroupsViewMode.VIEW)}
            type="button"
            className="-tw-ml-2 tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Back</span>
          </button>
        )}
      </div>

      <h1 className={NETWORK_PAGE_TITLE_CLASSES}>Groups</h1>

      {components[viewMode]}
    </div>
  );
}
