"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
}

const MessagesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesWrapper defaultPath="/messages" showLeftSidebar={true}>
      {children}
    </WavesMessagesWrapper>
  );
};

const MessagesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <MessagesDesktop {...props} />
  </ContentTabProvider>
);

export default MessagesDesktopWithProvider;
