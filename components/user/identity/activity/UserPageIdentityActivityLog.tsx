import { useEffect, useRef, useState } from "react";
import {
  IProfileAndConsolidations,
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../../../entities/IProfile";
import UserPageIdentityActivityLogHeader from "./UserPageIdentityActivityLogHeader";
import UserPageIdentityActivityLogFilter from "./filter/UserPageIdentityActivityLogFilter";
import { Page } from "../../../../helpers/Types";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import UserPageIdentityActivityLogList from "./list/UserPageIdentityActivityLogList";

export default function UserPageIdentityActivityLog({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [selectedFilters, setSelectedFilters] = useState<
    ProfileActivityLogType[]
  >([]);

  const onFilter = (filter: ProfileActivityLogType) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const [logTypeParams, setLogTypeParams] = useState<string>("");
  useEffect(() => {
    if (!selectedFilters.length) {
      setLogTypeParams("");
      return;
    }
    setLogTypeParams(selectedFilters.map((f) => f.toLowerCase()).join(","));
  }, [selectedFilters]);

  const {
    isLoading,
    isError,
    data: logs,
    error,
  } = useQuery<Page<ProfileActivityLog>>({
    queryKey: [
      "profile-logs",
      {
        profile: user,
        page: 1,
        page_size: 100,
        log_type: logTypeParams,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<Page<ProfileActivityLog>>({
        endpoint: `profile-logs`,
        params: {
          profile: user,
          page: "1",
          page_size: "100",
          log_type: logTypeParams,
        },
      }),
    enabled: !!user,
    // initialData: initialProfile,
  });
  return (
    <div className="tw-bg-neutral-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityActivityLogHeader profile={profile} />
      <div className="tw-max-h-[28rem] tw-transform-gpu tw-scroll-py-3 tw-overflow-y-auto">
        <UserPageIdentityActivityLogFilter
          selected={selectedFilters}
          setSelected={onFilter}
        />
        <UserPageIdentityActivityLogList logs={logs?.data ?? []} />
      </div>
    </div>
  );
}
