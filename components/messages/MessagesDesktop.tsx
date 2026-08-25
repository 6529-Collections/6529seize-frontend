"use client";

import type { ReactNode } from "react";
import React from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";
import { WaveDeleteFlowProvider } from "../waves/header/options/delete/WaveDeleteFlowContext";

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
    <WaveDeleteFlowProvider>
      <MessagesDesktop {...props} />
    </WaveDeleteFlowProvider>
  </ContentTabProvider>
);

export default MessagesDesktopWithProvider;
