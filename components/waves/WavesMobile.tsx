"use client";

import React, { ReactNode } from "react";
import BrainMobile from "../brain/BrainMobile";

interface Props {
  readonly children: ReactNode;
}

// For now, reuse the existing BrainMobile until we create wave-specific mobile components
const WavesMobile: React.FC<Props> = ({ children }) => {
  return <BrainMobile>{children}</BrainMobile>;
};

export default WavesMobile;