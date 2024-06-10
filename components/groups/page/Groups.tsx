import { useContext, useEffect, useState } from "react";
import GroupCreate from "./create/GroupCreate";
import GroupsList from "./list/GroupsList";
import { AuthContext } from "../../auth/Auth";
import { usePathname, useSearchParams } from "next/navigation";

enum GroupsViewMode {
  CREATE = "CREATE",
  VIEW = "VIEW",
}

export default function Groups() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getViewMode = (): GroupsViewMode => {
    const mode = searchParams.get("mode");
    if (mode === GroupsViewMode.CREATE) return GroupsViewMode.CREATE;
    return GroupsViewMode.VIEW;
  };

  const { connectedProfile, requestAuth } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState(getViewMode());

  const onViewModeChange = async (mode: GroupsViewMode): Promise<void> => {
    if (mode === GroupsViewMode.CREATE) {
      const { success } = await requestAuth();
      if (!success) return;
    }

    setViewMode(mode);
  };

  const components: Record<GroupsViewMode, JSX.Element> = {
    [GroupsViewMode.VIEW]: <GroupsList />,
    [GroupsViewMode.CREATE]: (
      <GroupCreate onCompleted={() => onViewModeChange(GroupsViewMode.VIEW)} />
    ),
  };

  useEffect(() => {
    if (!connectedProfile?.profile?.handle) {
      onViewModeChange(GroupsViewMode.VIEW);
    }
  }, [connectedProfile]);

  return (
    <div>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <h1 className="tw-float-none">Groups</h1>
        {viewMode !== GroupsViewMode.CREATE &&
          !!connectedProfile?.profile?.handle && (
            <button
              type="button"
              onClick={() => onViewModeChange(GroupsViewMode.CREATE)}
              className="tw-inline-flex tw-items-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-shadow-sm hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-size-5 tw-mr-2 -tw-ml-1 tw-flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create New</span>
            </button>
          )}
      </div>

      {components[viewMode]}
    </div>
  );
}
