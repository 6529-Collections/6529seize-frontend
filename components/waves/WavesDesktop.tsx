"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
}

const WavesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesWrapper defaultPath="/discover" showLeftSidebar={true}>
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
