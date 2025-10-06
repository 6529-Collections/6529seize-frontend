import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { Tooltip } from "react-tooltip";
import UserCICTypeIconTooltip from "./tooltip/UserCICTypeIconTooltip";
import UserCICTypeIcon from "./UserCICTypeIcon";

export default function UserCICTypeIconWrapper({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const tooltipId = `user-cic-type-tooltip-${profile.id}`;
  
  return (
    <>
      <div 
        data-tooltip-id={tooltipId}
        className="tw-cursor-pointer"
      >
        <UserCICTypeIcon cic={profile.cic} />
      </div>
      
      <Tooltip
        id={tooltipId}
        clickable={true}
        place="bottom"
        opacity={1}
        style={{
          backgroundColor: "#26272B",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "0",
          maxWidth: "360px",
          zIndex: 999999,
        }}
      >
        <UserCICTypeIconTooltip profile={profile} />
      </Tooltip>
    </>
  );
}