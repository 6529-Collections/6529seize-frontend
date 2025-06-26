import React from "react";
import LazyTippy from "./LazyTippy";
import UserProfileTooltip from "../../user/utils/profile/UserProfileTooltip";
import useDeviceInfo from "../../../hooks/useDeviceInfo";

interface UserProfileTooltipWrapperProps {
  readonly user: string;
  readonly children: React.ReactElement;
  readonly placement?: "top" | "bottom" | "left" | "right";
}

export default function UserProfileTooltipWrapper({ 
  user, 
  children, 
  placement = "bottom" 
}: UserProfileTooltipWrapperProps) {
  const { hasTouchScreen } = useDeviceInfo();

  const removeTooltipStyling = (instance: any) => {
    const box = instance.popper.querySelector('.tippy-box');
    const content = instance.popper.querySelector('.tippy-content');
    
    if (box) {
      box.style.setProperty('background', 'transparent', 'important');
      box.style.setProperty('padding', '0', 'important');
      box.style.setProperty('border', 'none', 'important');
      box.style.setProperty('box-shadow', 'none', 'important');
    }
    if (content) {
      content.style.setProperty('padding', '0', 'important');
    }
  };

  // If it's a touch device, just render the children without the tooltip
  if (hasTouchScreen) {
    return <>{children}</>;
  }

  return (
    <LazyTippy
      placement={placement}
      interactive={false}
      delay={[500, 200]}
      content={<UserProfileTooltip user={user} />}
      onShow={removeTooltipStyling}>
      {children}
    </LazyTippy>
  );
}