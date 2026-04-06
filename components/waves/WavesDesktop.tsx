"use client";

import type { ReactNode } from "react";
import React from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
  readonly showLeftSidebar?: boolean | undefined;
  readonly allowRightSidebar?: boolean | undefined;
  readonly allowDropOverlay?: boolean | undefined;
  readonly isPublicReadOnly?: boolean | undefined;
}

const WavesDesktop: React.FC<Props> = ({
  children,
  showLeftSidebar = true,
  allowRightSidebar = true,
  allowDropOverlay = true,
  isPublicReadOnly = false,
}) => {
  return (
    <WavesMessagesWrapper
      defaultPath="/waves"
      showLeftSidebar={showLeftSidebar}
      allowRightSidebar={allowRightSidebar}
      allowDropOverlay={allowDropOverlay}
      isPublicReadOnly={isPublicReadOnly}
    >
      {children}
    </WavesMessagesWrapper>
  );
};

const WavesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <WavesDesktop {...props} />
  </ContentTabProvider>
);

export default WavesDesktopWithProvider;
