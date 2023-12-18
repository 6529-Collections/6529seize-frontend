import { IProfileAndConsolidations } from "../../../../../../../entities/IProfile";

export default function UserPageIdentityActivityLogItemHandle({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
      {profile?.profile?.handle}
    </span>
  );
}
