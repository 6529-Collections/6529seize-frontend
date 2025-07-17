import React from "react";
import CustomTooltip from "./CustomTooltip";
import UserProfileTooltip from "../../user/utils/profile/UserProfileTooltip";
import useDeviceInfo from "../../../hooks/useDeviceInfo";

interface UserProfileTooltipWrapperProps {
  readonly user: string;
  readonly children: React.ReactElement;
  readonly placement?: "top" | "bottom" | "left" | "right" | "auto";
}

export default function UserProfileTooltipWrapper({ 
  user, 
  children, 
  placement = "auto" 
}: UserProfileTooltipWrapperProps) {
  const { hasTouchScreen } = useDeviceInfo();

  // If it's a touch device, just render the children without the tooltip
  if (hasTouchScreen) {
    return <>{children}</>;
  }

  return (
    <CustomTooltip
      content={<UserProfileTooltip user={user} />}
      placement={placement}
      delayShow={500}
      delayHide={0}
    >
      {children}
    </CustomTooltip>
  );
}