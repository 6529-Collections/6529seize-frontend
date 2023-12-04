import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { createPossessionStr } from "../../../../helpers/Helpers";

export default function UserPageIdentityActivityLogHeader({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const [possessionName, setPossessionName] = useState<string>(
    createPossessionStr(profile.profile?.handle ?? null)
  );

  useEffect(() => {
    setPossessionName(createPossessionStr(profile.profile?.handle ?? null));
  }, [profile]);
  return (
    <div className="tw-h-16 tw-px-8">
      <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-[#333333]">
        <h3 className="mb-0 tw-text-lg tw-font-semibold tw-text-neutral-50 tw-tracking-tight">
          <span>{possessionName}</span> Activity Log
        </h3>
      </div>
    </div>
  );
}
