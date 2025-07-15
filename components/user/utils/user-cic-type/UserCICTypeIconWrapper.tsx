import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import { Tooltip } from "react-tooltip";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <>
      <div data-tooltip-id={`cic-type-${profile.id}`}>
        <UserCICTypeIcon cic={profile.cic} />
      </div>
      <Tooltip
        id={`cic-type-${profile.id}`}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        <UserCICTypeIconTooltip profile={profile} />
      </Tooltip>
    </>
  );
}
