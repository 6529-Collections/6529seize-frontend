"use client";

import React, { ReactNode } from "react";
import BrainMobile from "../brain/BrainMobile";

interface Props {
  readonly children: ReactNode;
}

// For now, reuse the existing BrainMobile until we create message-specific mobile components
const MessagesMobile: React.FC<Props> = ({ children }) => {
  return <BrainMobile>{children}</BrainMobile>;
};

export default MessagesMobile;