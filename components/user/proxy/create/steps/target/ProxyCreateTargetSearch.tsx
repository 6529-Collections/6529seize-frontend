import { CommunityMemberMinimal } from "../../../../../../entities/IProfile";
import CommonProfileSearch from "../../../../../utils/input/profile-search/CommonProfileSearch";

export default function ProxyCreateTargetSearch({
  onTargetSelect,
}: {
  readonly onTargetSelect: (target: CommunityMemberMinimal | null) => void;
}) {
  return (
    <div className="tw-w-72">
      <CommonProfileSearch
        value=""
        placeholder="User"
        onProfileSelect={onTargetSelect}
      />
    </div>
  );
}
