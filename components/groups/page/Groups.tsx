import { useContext, useEffect, useState } from "react";
import GroupCreate from "./create/GroupCreate";
import { AuthContext } from "../../auth/Auth";
import GroupsPageListWrapper from "./GroupsPageListWrapper";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";

enum GroupsViewMode {
  CREATE = "CREATE",
  VIEW = "VIEW",
}

const GROUP_EDIT_SEARCH_PARAM = "edit";

export default function Groups() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { connectedProfile, requestAuth, activeProfileProxy } =
    useContext(AuthContext);

  const edit = searchParams.get(GROUP_EDIT_SEARCH_PARAM);

  const [viewMode, setViewMode] = useState(GroupsViewMode.VIEW);

  const onViewModeChange = async (mode: GroupsViewMode): Promise<void> => {
    if (mode === GroupsViewMode.CREATE) {
      const { success } = await requestAuth();
      if (!success) return;
    } else {
      router.replace(pathname, undefined, {
        shallow: true,
      });
    }

    setViewMode(mode);
  };

  useEffect(() => {
    if (edit && !!connectedProfile?.profile?.handle && !activeProfileProxy) {
      onViewModeChange(GroupsViewMode.CREATE);
    }
  }, [edit]);

  useEffect(() => {
    if (!connectedProfile?.profile?.handle || activeProfileProxy) {
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
      <div className="tailwind-scope tw-mb-4 lg:tw-mb-8">
        {viewMode === GroupsViewMode.CREATE && (
          <button
            onClick={() => onViewModeChange(GroupsViewMode.VIEW)}
            type="button"
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
          >
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
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
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <h1 className="tw-float-none">Groups</h1>
      </div>

      {components[viewMode]}
    </div>
  );
}
