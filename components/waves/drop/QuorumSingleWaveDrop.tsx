"use client";

import React from "react";
import { DefaultSingleWaveDrop } from "./DefaultSingleWaveDrop";
import type { SingleWaveDropProps } from "../drops/participation/participationRenderer.types";

export const QuorumSingleWaveDrop: React.FC<SingleWaveDropProps> = (props) => {
  // Keep quorum on the default detail view until the proposal-specific design lands.
  return <DefaultSingleWaveDrop {...props} />;
};
